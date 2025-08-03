package com.github.musicsnsproject.web.dto.account;

import com.github.accountmanagementproject.common.myenum.Gender;

public interface AccountDefaultValueInterface {
    default String getDefaultProfileImg(Gender gender){
        if(gender==null) return Gender.UNKNOWN.getDefaultProfileImgUrl();
        return gender.getDefaultProfileImgUrl();
    }
}
