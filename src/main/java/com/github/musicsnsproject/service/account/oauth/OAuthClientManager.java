package com.github.musicsnsproject.service.account.oauth;

import com.github.musicsnsproject.common.exceptions.CustomBadRequestException;
import com.github.musicsnsproject.common.myenum.OAuthProvider;
import com.github.musicsnsproject.config.client.oauth.OAuthApiClient;
import com.github.musicsnsproject.config.client.oauth.dto.tokens.OAuthTokens;
import com.github.musicsnsproject.config.client.oauth.dto.userinfo.OAuthUserInfo;
import com.github.musicsnsproject.web.dto.account.oauth.request.OAuthLoginParams;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class OAuthClientManager {
    private final Map<OAuthProvider, OAuthApiClient> clients;

    //OAuthApiClient를 상속받은 클라이언트들을 전부 불러와 Map으로 만들어준다.
    //빈주입을 할때 해당 인터페이스의 구현체들의 빈을 찾아서 빈을 주입해준다. 구현체들에도 @Component 가 있어야하는이유
    public OAuthClientManager(List<OAuthApiClient> clients) {
        this.clients = clients.stream().collect(
                Collectors.toUnmodifiableMap(OAuthApiClient::oAuthProvider, Function.identity())
        );//key 값에 oAuthProvider 메서드를 호출하여 OAuthProvider 값을 넣어주고 value 값에는 OAuthApiClient 인스턴스 자체를 값으로 사용
    }

    public OAuthUserInfo request(OAuthLoginParams params)  {
        //get요청으로 받아온 OAuthProvider에 해당하는 클라이언트를 가져온다.
        OAuthApiClient client = clients.get(params.oAuthProvider());
        try {
            OAuthTokens tokens = client.requestAccessToken(params);
            return client.requestOauthInfo(tokens);
        }catch (HttpClientErrorException ex){
            throw CustomBadRequestException.of()
                    .systemMessage(ex.getMessage())
                    .customMessage("잘못된 소셜 인증 코드")
                    .request(Map.of("code", params.getAuthorizationCode(),
                            "responseBody", ex.getResponseBodyAsString()))
                    .build();
        }
    }
}
