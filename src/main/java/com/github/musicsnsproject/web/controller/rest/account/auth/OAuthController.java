package com.github.musicsnsproject.web.controller.rest.account.auth;
import com.github.musicsnsproject.common.MyUtils;
import com.github.musicsnsproject.common.myenum.OAuthProvider;
import com.github.musicsnsproject.service.account.oauth.OAuthLoginService;
import com.github.musicsnsproject.service.account.oauth.OAuthProviderService;
import com.github.musicsnsproject.web.dto.account.oauth.request.*;
import com.github.musicsnsproject.web.dto.account.oauth.response.AuthResult;
import com.github.musicsnsproject.web.dto.account.oauth.response.OAuthDtoInterface;
import com.github.musicsnsproject.web.dto.account.oauth.response.OAuthSignUpDto;
import com.github.musicsnsproject.web.dto.response.CustomSuccessResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/oauth")
@RequiredArgsConstructor
public class OAuthController implements OAuthControllerDocs {
    private final OAuthProviderService oAuthProviderService;
    private final OAuthLoginService oAuthLoginService;



    @GetMapping("/{provider}/test")//테스트용 oAuthRequest 로 리다이렉션됨
    public ResponseEntity<Void> requestOAuthCodeUrlRedirect(@PathVariable OAuthProvider provider, HttpServletRequest httpServletRequest) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, oAuthProviderService.getOAuthLoginPageUrl(provider, httpServletRequest))
                .build();
    }


    @Override
    @GetMapping("/{provider}/callback")//백에서 Post 요청 api 메서드 호출해서 처리
    public ResponseEntity<CustomSuccessResponse<OAuthDtoInterface>> oAuthRequest(@PathVariable OAuthProvider provider, HttpServletRequest request) {

        OAuthCodeParams codeParams = OAuthCodeParams.of(
                request.getParameter("code"),
                request.getParameter("state"),
                request.getRequestURL().toString()
        );

        return loginOAuth( OAuthLoginParams.fromCodeParams(codeParams,provider) );
    }

    @GetMapping("/{provider}")
    public CustomSuccessResponse<String> getProviderAuthUrl(@PathVariable OAuthProvider provider, @RequestParam String redirectUri) {
        return CustomSuccessResponse.ofOk("인증 URL 생성 성공", oAuthLoginService.getAuthorizationUrl(provider, redirectUri));
    }

    @PostMapping("/kakao")
    public ResponseEntity<CustomSuccessResponse<OAuthDtoInterface>> loginKakao(@RequestBody KakaoLoginParams params) {
        return loginOAuth(params);
    }

    @PostMapping("/naver")
    public ResponseEntity<CustomSuccessResponse<OAuthDtoInterface>> loginNaver(@RequestBody NaverLoginParams params) {
        return loginOAuth(params);
    }

    @PostMapping("/google")
    public ResponseEntity<CustomSuccessResponse<OAuthDtoInterface>> loginGoogle(@RequestBody GoogleLoginParams params) {
        return loginOAuth(params);
    }

    @PostMapping("/github")
    public ResponseEntity<CustomSuccessResponse<OAuthDtoInterface>> loginGithub(@RequestBody GithubLoginParams params) {
        return loginOAuth(params);
    }
    @PostMapping("/microsoft")
    public ResponseEntity<CustomSuccessResponse<OAuthDtoInterface>> loginMicrosoft(@RequestBody MicrosoftLoginParams params) {
        return loginOAuth(params);
    }
    @PostMapping("/twitter")
    public ResponseEntity<CustomSuccessResponse<OAuthDtoInterface>> loginTwitter(@RequestBody TwitterLoginParams params) {
        return loginOAuth(params);
    }
    @PostMapping("/facebook")
    public ResponseEntity<CustomSuccessResponse<OAuthDtoInterface>> loginFacebook(@RequestBody FacebookLoginParams params) {
        return loginOAuth(params);
    }

    private ResponseEntity<CustomSuccessResponse<OAuthDtoInterface>> loginOAuth(OAuthLoginParams params) {
        AuthResult result = oAuthLoginService.loginOrCreateTempAccount(params);
        CustomSuccessResponse<OAuthDtoInterface> response = CustomSuccessResponse
                .of(result.getHttpStatus(), result.getMessage(), result.getResponse());
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Is-Connection", String.valueOf(result.isConnection()));

        return MyUtils.createResponseEntity(response, headers);
    }


    @PostMapping("/sign-up")
    public ResponseEntity<CustomSuccessResponse<Void>> oAuthSignUp(@RequestBody @Valid OAuthSignUpDto oAuthSignUpDto) {
        oAuthLoginService.signUp(oAuthSignUpDto);
        CustomSuccessResponse<Void> signUpResponse = CustomSuccessResponse
                .emptyData(HttpStatus.CREATED, "회원가입 완료");
        return ResponseEntity
                .status(signUpResponse.getHttpStatus())
                .body(signUpResponse);
    }
}



