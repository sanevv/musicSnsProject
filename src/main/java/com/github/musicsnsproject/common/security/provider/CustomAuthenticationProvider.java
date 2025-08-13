package com.github.musicsnsproject.common.security.provider;

import com.github.musicsnsproject.common.event.CustomAuthFailEvent;
import com.github.musicsnsproject.common.exceptions.CustomBadCredentialsEventEx;
import com.github.musicsnsproject.common.exceptions.CustomBadCredentialsException;
import com.github.musicsnsproject.common.exceptions.CustomServerException;
import com.github.musicsnsproject.common.security.userdetails.CustomUserDetails;
import com.github.musicsnsproject.service.account.auth.CustomUserDetailsService;
import com.github.musicsnsproject.web.dto.account.auth.response.AuthFailureMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CustomAuthenticationProvider implements AuthenticationProvider {
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;  // 이벤트 발행용
    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String password = authentication.getCredentials().toString();

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        checkUserStatus(userDetails);

        if ( !passwordEncoder.matches(password, userDetails.getPassword()) )
            throw new BadCredentialsException("인증 실패");

        return authentication;
    }
    public void oauthAuthenticate(CustomUserDetails userDetails) {
        checkUserStatus(userDetails);
        Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        eventPublisher.publishEvent(new AuthenticationSuccessEvent(authentication));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private void checkUserStatus(CustomUserDetails customUserDetails) {
        if (!customUserDetails.isAccountNonExpired()) {
            throwCustomBadCredentialsException("만료된 계정입니다.", customUserDetails);
        } else if (!customUserDetails.isAccountNonLocked()) {
            throwCustomBadCredentialsException("잠긴 계정입니다.", customUserDetails);
        } else if (!customUserDetails.isEnabled()) {
            throwCustomBadCredentialsException("비활성화된 계정입니다.", customUserDetails);
        } else if (!customUserDetails.isCredentialsNonExpired()) {
            throwCustomBadCredentialsException("만료된 자격 증명입니다.", customUserDetails);
        }
    }
    private void throwCustomBadCredentialsException(String message, CustomUserDetails customUserDetails) {
        throw CustomBadCredentialsException.of()
                .customMessage(message)
                .request(new AuthFailureMessage(customUserDetails))
                .build();
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
