(function () {
    let refreshPromise = null; // 진행 중인 토큰 갱신 Promise

    // 토큰 갱신 함수 (단일 인스턴스 보장)
    function refreshAuthToken() {
        // 이미 진행 중인 갱신이 있다면 그 Promise를 반환
        if (refreshPromise) {
            return refreshPromise;
        }

        console.log("토큰 갱신 시작");

        refreshPromise = axios.post(`${ctxPath}/api/auth/refresh`, {}, {
            headers: AuthFunc.getAuthHeader(),
            withCredentials: true
        })
            .then(response => {
                const responseData = response.data.success.responseData;
                localStorage.setItem('accessToken', responseData.accessToken);
                localStorage.setItem('tokenType', responseData.tokenType);
                console.log("토큰 갱신 완료");
                return response;
            })
            .catch(error => {
                console.error('토큰 갱신 실패:', error);
                alert('세션이 만료되었습니다. 다시 로그인해주세요.');
                throw error;
            })
            .finally(() => {
                // 완료되면 Promise 초기화
                refreshPromise = null;
            });

        return refreshPromise;
    }

//Auth 인증 관련 - 동적으로 헤더 생성하는 함수
    function getAuthHeader() {
        const accessToken = localStorage.getItem('accessToken');
        const tokenType = localStorage.getItem('tokenType');

        if (accessToken && tokenType) {
            return {
                'Authorization': `${tokenType} ${accessToken}`
            };
        }
        return {};
    }

    let loginRedirected = false; // 이미 로그인 리다이렉트 했는지 체크
    // 토큰 만료 시 자동 갱신 및 재시도 함수
    async function apiRequest(requestFn, maxRetries = 1) {
        try {
            return await requestFn();
        } catch (error) {
            console.log("에러받음");
            console.log(error);

            // 401 에러이고 초기 접속 전에 토큰이 없는 경우
            if (error?.response?.status === 401 && error?.response?.data?.error?.customMessage === "토큰 정보 없음") {
                if(!loginRedirected){
                    loginRedirected = true; // 리다이렉트 플래그 설정
                    alert('로그인이 필요합니다.');
                    location.href = `${ctxPath}/auth/login`;
                }
                return;
            }

            // 401 에러이고 토큰 만료인 경우
            if (error?.response?.status === 401 &&
                error?.response?.data?.error?.customMessage === "만료된 토큰" &&
                maxRetries > 0) {
                try {
                    // 토큰 갱신
                    console.log("갱신요청")
                    await refreshAuthToken();
                    // 재시도
                    return await apiRequest(requestFn, maxRetries - 1);
                } catch (refreshError) {
                    // 토큰 갱신 실패 시 원래 에러 던지기
                    throw error;
                }
            }

            // 다른 에러는 그대로 던지기
            throw error;
        }
    }

// 로그아웃 함수
    const logout = async () => {
        try {
            // localStorage에서 액세스 토큰 가져오기
            const authHeader = getAuthHeader();

            if (!authHeader) {
                throw new Error('로그인 상태가 아닙니다.');
            }

            const response = await axios.post('/api/auth/logout', {}, {
                headers: authHeader,
                withCredentials: true // 쿠키 포함
            });

            // 성공 시 로컬 스토리지에서 토큰 제거
            localStorage.removeItem('accessToken');
            localStorage.removeItem('tokenType');

            return response.data;

        } catch (error) {
            console.error('로그아웃 실패:', error);

            // 401 에러인 경우 토큰이 이미 만료되었으므로 로컬 스토리지 정리
            if (error.response?.status === 401) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('tokenType');
            }

            throw error;
        }
    };
    // 전역으로 노출 (일반 스크립트용)
    window.AuthFunc = {
        getAuthHeader,
        apiRequest,
        logout,
        primaryKey,
        refreshAuthToken
    };
    // // ES6 모듈로도 export (모듈 스크립트용)
    // if (typeof module !== 'undefined' && module.exports) {
    //     module.exports = { getAuthHeader, apiRequest, logout };
    // }
    //
    // // ES6 export (브라우저 모듈용)
    // if (typeof window !== 'undefined') {
    //     window.getAuthHeader = getAuthHeader;
    //     window.apiRequest = apiRequest;
    //     window.logout = logout;
    // }
})();

function primaryKey() {
    return AuthFunc.apiRequest(() =>
        axios.get(`${ctxPath}/api/auth/pk`, {headers: AuthFunc.getAuthHeader()})
    ).then(response => {
        return response.data.success.responseData;
    }).catch(error => {
        console.error('Error fetching primary key:', error);
        throw error;
    });
}