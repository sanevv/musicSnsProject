package com.github.musicsnsproject.repository.jpa.account.history.login;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long>, LoginHistoryQueryRepository {
}
