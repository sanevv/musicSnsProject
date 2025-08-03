package com.github.musicsnsproject.web.dto.account.auth.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.github.accountmanagementproject.common.myenum.UserStatus;
import com.github.accountmanagementproject.repository.account.user.MyUser;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AuthFailureMessage {
    private final String nickname;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final Integer failureCount;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String status;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final LocalDateTime failureDate;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final LocalDateTime withdrawalDate;

    public AuthFailureMessage(MyUser myUser){
        this.nickname = myUser.getNickname();
        this.failureCount = myUser.getFailureCount() == 0 || myUser.isDisabled() ? null:myUser.getFailureCount();
        this.status = myUser.getStatus()== UserStatus.NORMAL?null:myUser.getStatus().getValue();
        this.failureDate = myUser.isDisabled()?null:myUser.getFailureDate();
        this.withdrawalDate = myUser.getWithdrawalDate();
    }
}
