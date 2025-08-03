package com.github.musicsnsproject.config.client.oauth.code;

import com.github.accountmanagementproject.common.myenum.OAuthProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class GoogleCodeUrlGenerator extends OAuthCodeUrlGenerator {
    @Value("${oauth.google.url.code}")
    private String codeUrl;
    @Value("${oauth.google.client-id}")
    private String clientId;


    @Override
    public OAuthProvider oAuthProvider() {
        return OAuthProvider.GOOGLE;
    }

    @Override
    protected UriComponents getParam(String redirectUrl) {
        return UriComponentsBuilder.newInstance()
                .queryParam("client_id", this.clientId)
                .queryParam("redirect_uri", redirectUrl)
                .queryParam("response_type", "code")
                .queryParam("scope", "openid profile email")
                .queryParam("access_type", "offline")
                .build();
    }

    @Override
    protected String baseAuthCodeUrl() {

        return this.codeUrl+"/o/oauth2/auth";
    }
}
