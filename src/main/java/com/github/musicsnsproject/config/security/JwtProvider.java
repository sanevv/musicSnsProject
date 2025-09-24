package com.github.musicsnsproject.config.security;


import com.github.musicsnsproject.common.exceptions.CustomNotAcceptException;
import com.github.musicsnsproject.repository.redis.RedisRepository;
import com.github.musicsnsproject.web.dto.account.auth.response.TokenResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.log4j.Log4j2;
import org.jasypt.encryption.StringEncryptor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.json.BasicJsonParser;
import org.springframework.boot.web.server.Cookie;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Log4j2
@Component
public class JwtProvider {
    private final RedisRepository redisRepository;

    private final SecretKey key;//= Jwts.SIG.HS256.key().build();  이건 랜덤키 자동생성
//    public JwtProvider(@Value("${jwt-password.source}") String encryptedKey,
//                       @Qualifier("jasyptStringEncryptor") StringEncryptor encryptor,
//                       RedisRepository redisRepository) {
//        String decryptedKey = encryptor.decrypt(encryptedKey); // 여기서 복호화
//        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(decryptedKey));
//        this.redisRepository = redisRepository;
//    }
    public JwtProvider(@Value("${jwt-password.source}")String keySource, RedisRepository redisRepository) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(keySource));
        this.redisRepository = redisRepository;
    }


    private static final Duration REFRESH_TOKEN_EXPIRATION = Duration.ofDays(7);//7일
    private static final Duration ACCESS_TOKEN_EXPIRATION = Duration.ofMinutes(2000);//1분

    public static final String TOKEN_TYPE = "Bearer";
    public static final String AUTH_HEADER_NAME = "Authorization";
    public static final String AUTH_EXCEPTION_NAME = "auth-exception";
    public static final String REFRESH_COOKIE_NAME = "RefreshToken";



    public static String authHeaderToToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith(TOKEN_TYPE + " ")) return null;
        return authHeader.replace(TOKEN_TYPE + " ", "");
    }

    //이메일과 롤을 넣어 엑세스토큰 생성
    public String createNewAccessToken(String userId, String roles){
        Date now = new Date();
        return Jwts.builder()
                .issuedAt(now)
                .expiration(new Date(now.getTime()+ACCESS_TOKEN_EXPIRATION.toMillis()))
                .subject(userId)
                .claim("roles", roles)
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }
    //새로운 리프레시 토큰 생성
    public String createNewRefreshToken() {
        Date now = new Date();
        return createRefreshToken(new Date(now.getTime()+REFRESH_TOKEN_EXPIRATION.toMillis()));
    }
    //만료시간 지정 리프레시 토큰 생성
    public String createRefreshToken(Date exp){
        return Jwts.builder()
                .issuedAt(new Date())
                .expiration(exp)
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }
    private TokenResponse tokenBuilder(String accessToken, String refreshToken){
        ResponseCookie refreshTokenCookie = createRefreshTokenCookie(refreshToken);
        return TokenResponse.builder()
                .tokenType(TOKEN_TYPE)
                .accessToken(accessToken)
                .refreshTokenCookie(refreshTokenCookie)
                .build();
    }
    private TokenResponse tokenBuilder(String accessToken, String refreshToken, boolean isConnection){
        ResponseCookie refreshTokenCookie = createRefreshTokenCookie(refreshToken);
        return TokenResponse.builder()
                .tokenType(TOKEN_TYPE)
                .accessToken(accessToken)
                .refreshTokenCookie(refreshTokenCookie)
                .isConnection(isConnection)
                .build();
    }


    //리프레시 토큰의 유효시간만큼 저장기간을 설정하고 레디스에 저장 이후 Dto 생성
    private TokenResponse saveRefreshTokenAndCreateTokenDto(String accessToken, String refreshToken, Duration exp){
        redisRepository.save(accessToken, refreshToken, exp);
        return tokenBuilder(accessToken, refreshToken);
    }

    public TokenResponse saveRefreshTokenAndCreateTokenDto(String accessToken, String refreshToken){
        redisRepository.save(accessToken, refreshToken, REFRESH_TOKEN_EXPIRATION);
        return tokenBuilder(accessToken, refreshToken);
    }
    public TokenResponse saveRefreshTokenAndCreateTokenDto(String accessToken, String refreshToken, boolean isConnection){
        redisRepository.save(accessToken, refreshToken, REFRESH_TOKEN_EXPIRATION);
        return tokenBuilder(accessToken, refreshToken, isConnection);
    }


    private ResponseCookie.ResponseCookieBuilder getBaseCookieBuilder(String value) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, value)
                .httpOnly(true) // JavaScript로 접근 불가
                .path("/") // 전체 경로에서 사용
                .sameSite(Cookie.SameSite.STRICT.attributeValue()); // SameSite 설정 CSRF 공격 방지
//                .secure(true) // HTTPS에서만 전송 (개발 환경에서는 주석 처리)
    }

    private ResponseCookie createRefreshTokenCookie(String refreshToken) {
        return refreshToken == null || refreshToken.isBlank() ?
                getBaseCookieBuilder("").maxAge(0).build()
                : getBaseCookieBuilder(refreshToken).maxAge(REFRESH_TOKEN_EXPIRATION).build(); // 토큰이 있으면 유효시간 설정
    }

    public Authentication getAuthentication(String accessToken) {
            Jws<Claims> claimsJws = tokenParsing(accessToken);

            Claims payload = claimsJws.getPayload();
            if(payload.getSubject()==null) throw new NullPointerException("payload의 subject값이 null 입니다.");
            Collection<? extends GrantedAuthority> roles = Arrays.stream(payload.get("roles").toString().split(","))
                .map(role -> new SimpleGrantedAuthority(role))
                .toList();
            long sub = Long.parseLong(payload.getSubject());
            return new UsernamePasswordAuthenticationToken(sub, accessToken, roles);
    }

    public TokenResponse tokenRefresh(String accessToken, String clientRefreshToken){
        //리프레시 토큰 유효성 검사와 파싱
        Jws<Claims> refreshTokenClaims = tokenParsing(clientRefreshToken);
        String dbRefreshToken = redisRepository.getAndDeleteValue(accessToken);//가져오면서 지움
        //사용자의 리프레시토큰과 db의 리프레시토큰 대조
        if(!clientRefreshToken.equals(dbRefreshToken))
            throw new NoSuchElementException("Redis DB에 해당 액세스 토큰의 리프레시 토큰이 없거나 일치하지 않음");
        //새로운 토큰 생성
        String newAccessToken = createANewAccessTokenWithOldAccessToken(accessToken);

        // 리프레시 토큰 유효시간
        Date refreshTokenExp = refreshTokenClaims.getPayload().getExpiration();
        // 해당 유효시간으로 새로운 토큰 생성
        String newRefreshToken = createRefreshToken(refreshTokenExp);

        return saveRefreshTokenAndCreateTokenDto(newAccessToken, newRefreshToken,
                Duration.between(Instant.now(), refreshTokenExp.toInstant()));
    }

    private String createANewAccessTokenWithOldAccessToken(String accessToken) {
        //payload 추출
        Map<String, Object> payload = extractPayloadFromToken(accessToken);
        //새로운 액세스 토큰 생성
        return createNewAccessToken(payload.get("sub").toString(), payload.get("roles").toString());
    }
    public Object getUserIdFromToken(String accessToken) {
        Map<String, Object> payload = extractPayloadFromToken(accessToken);
        return payload.get("sub");
    }

    private Map<String, Object> extractPayloadFromToken(String accessToken) {
        //엑세스토큰 payload
        String payloadStr = new String(Base64.getUrlDecoder().decode(accessToken.split("\\.")[1]));
        //payload Map 형식으로 변환
        return new BasicJsonParser().parseMap(payloadStr);
    }

    public Jws<Claims> tokenParsing(String token){
        boolean isBlackList = redisRepository.getValue("blacklist:"+token) != null;
        if(isBlackList) throw CustomNotAcceptException.of()
                .systemMessage("블랙리스트에 등록된 토큰입니다.")
                .customMessage("로그아웃된 토큰입니다. 다시 로그인해주세요.")
                .request(token)
                .build();
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token);
    }

    public ResponseCookie deleteRefreshToken(String accessToken) {
        String refreshToken = redisRepository.getAndDeleteValue(accessToken);

        if (refreshToken != null) {
            log.info("리프레시 토큰 삭제 완료 - refreshToken: {}", refreshToken);
        } else {
            log.warn("삭제할 리프레시 토큰이 없음 - accessToken: {}", accessToken);
        }
        return createRefreshTokenCookie(null);
    }

    public void blackListAccessToken(String accessToken) {
        Map<String, Object> payload = extractPayloadFromToken(accessToken);
        Object exp = payload.get("exp");
        if (exp == null) return;

        long expTimestamp = Long.parseLong(exp.toString());
        Instant expInstant = Instant.ofEpochSecond(expTimestamp);
        Instant now = Instant.now();
        // 토큰이 이미 만료되었는지 확인
        if (expInstant.isBefore(now) || expInstant.equals(now))
            return; // 만료된 토큰은 블랙리스트에 추가할 필요 없음

        Duration blackListDuration = Duration.between(now, expInstant);
        redisRepository.save("blacklist:" + accessToken, "logout", blackListDuration);
        log.info("토큰 블랙리스트 추가 완료 - 만료까지: {}초", blackListDuration.getSeconds());
    }
}
