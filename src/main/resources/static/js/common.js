const asideNavigation = document.querySelector(".navigation-list");
const asideBtnList = asideNavigation.querySelectorAll(".btn");
const asideLayer = document.querySelectorAll(".aside-navigation-layer");
asideBtnList.forEach(btn => {

    const dataTarget = btn.dataset.target;

    if(!dataTarget) return;

    btn.addEventListener("click", () => {

        let thisLayer = document.querySelector(dataTarget);
        let isLayer = document.querySelector(dataTarget).classList.contains("on");

        if(isLayer){
            thisLayer.classList.remove("on");
            btn.classList.remove("active");
        }
        else {
            asideLayer.forEach(layer => layer.classList.remove("on"));
            asideBtnList.forEach(item2 => item2.classList.remove("active"));
            btn.classList.add("active");
            thisLayer.classList.add("on");
        }
    });

});

// 영역 외 클릭 시 팝업 닫기
document.addEventListener("click", (e) => {
    let isClickInside = [...asideNavigation.querySelectorAll(".btn"), ...asideLayer]
        .some(el => el.contains(e.target));

    if (!isClickInside) {
        asideLayer.forEach(layer => layer.classList.remove("on"));
        asideBtnList.forEach(btn => btn.classList.remove("active"));
    }
});

//
// // 메시지 팝업 관련
// const talkLayer = {
//     layer : document.querySelector("#talkLayer"),
//     btnTalk : document.querySelector("#btnTalk"),
//     btnTalkClose : document.querySelector("#btnTalkClose"),
//     open() {
//         this.layer.style.display = "block";
//     },
//     close() {
//         this.layer.style.display = "none";
//     }
// }
//
// talkLayer.btnTalk?.addEventListener("click", () => talkLayer.open());
// talkLayer.btnTalkClose?.addEventListener("click", () => talkLayer.close());

// 우측 감정 플레이리스트
const emotions = document.querySelector(".emotions");
emotionBtnList = emotions.querySelectorAll(".btn");
emotionBtnList.forEach(btn => {

    btn.addEventListener("click", () => {
        emotionBtnList.forEach(item => item.classList.remove("active"));
        btn.classList.add("active");
    });
});


/* 관리자 로그인 시 통계 버튼 보여주기 */
(function () {
	const contextPath =
		window.ctxPath ||
		(document.querySelector('meta[name="ctxPath"]') &&
			document.querySelector('meta[name="ctxPath"]').content) ||
		'';

	// 관리자 버튼  찾아오기
	function getAdminMenuElement() {
		return document.getElementById('adminStatsItem');
	}

	// 버튼을 화면에 보이게 설정
	function showAdminMenu() {
		const element = getAdminMenuElement();
		if (element) element.style.display = '';
	}

	// localStorage에 토큰이 있는지 확인
	function hasAccessToken() {
		return !!localStorage.getItem('accessToken');
	}

	// 인증 헤더 만들기
	function buildAuthHeaders() {
		const token = localStorage.getItem('accessToken');
		const type = localStorage.getItem('tokenType') || 'Bearer';
		const headers = { 'X-Requested-With': 'XMLHttpRequest' };
		if (token) headers.Authorization = `${type} ${token}`;
		return headers;
	}

	// JWT 안에 ROLE_ADMIN 있는지 확인 ====
	function checkAdminFromJwt() {
		try {
			const jwt = localStorage.getItem('accessToken');
			if (!jwt || jwt.split('.').length < 2) return false;

			const payloadBase64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
			const payload = JSON.parse(atob(payloadBase64));

			const roleCandidates = []
				.concat(payload.roles || [])
				.concat(payload.authorities || [])
				.concat(payload.scope || [])
				.concat(payload.scopes || [])
				.concat(payload.role || [])
				.concat(payload.auth || []);

			// 무조건 배열로 변환
			const roleList = Array.isArray(roleCandidates) ? roleCandidates : [roleCandidates];

			// "ROLE_ADMIN" 혹은 "ADMIN" 이 포함되어 있는지 확인
			const parsedRoles = roleList
				.flatMap(v => (typeof v == 'string' ? v.split(/[,\s]+/) : v))
				.filter(Boolean)
				.map(s => String(s).trim());

			const isAdmin = parsedRoles.includes('ROLE_ADMIN') || parsedRoles.includes('ADMIN');

			return isAdmin;
		} catch (e) {
			return false;
		}
	}

	// 서버에 물어보기
	function checkAdminFromServer() {
		return $.ajax({
			url: contextPath + '/api/auth/authorize-test',
			method: 'GET',
			headers: buildAuthHeaders()
		}).then(
			function (_data, _text, response) {
				if (response.status >= 200 && response.status < 300) return true;
				return $.Deferred().reject().promise(); // 실패 처리
			},
			function (xhr) {
				console.warn('[ADMIN BTN] authorize-test 실패 상태코드:', xhr && xhr.status);
				return $.ajax({
					url: contextPath + '/api/admin/stats/summary',
					method: 'GET',
					headers: buildAuthHeaders()
				}).then(
					function (_data, _text, response) {
						return response.status >= 200 && response.status < 300;
					},
					function (xhr2) {
						return false;
					}
				);
			}
		);
	}

	// 실행 부분
	function runCheck() {
		if (!getAdminMenuElement()) {
			let attempts = 0;
			const interval = setInterval(() => {
				attempts++;
				if (getAdminMenuElement() || attempts >= 20) {
					clearInterval(interval);
					checkCore();
				}
			}, 100);
		} else {
			checkCore();
		}
	}

	// 실제 관리자 여부 체크 실행
	function checkCore() {
		if (!hasAccessToken()) {
			return;
		}

		// JWT 안에 ROLE_ADMIN 있는지 확인
		if (checkAdminFromJwt()) {
			showAdminMenu();
			return;
		}

		// 서버에 물어보기
		checkAdminFromServer().then(function (isAdmin) {
			if (isAdmin) showAdminMenu();
			else console.log('[ADMIN BTN] 관리자가 아님 → 버튼 숨김 유지');
		});
	}

	if (document.readyState == 'loading') {
		document.addEventListener('DOMContentLoaded', runCheck);
	} else {
		runCheck();
	}
})();

document.addEventListener('DOMContentLoaded', () => {
    let notificationSound;
    let soundInitialized = false;

    function initSound() {
        if (soundInitialized) return; // 이미 실행된 경우 방지
        soundInitialized = true;

        notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjGH0fPTgjMGHm7A7+OZURE=');
        notificationSound.volume = 0.3;

        notificationSound.play().then(() => {
            notificationSound.pause();
            notificationSound.currentTime = 0;
            console.log("알림음 권한 확보됨");
        }).catch(err => {
            console.log("알림음 초기화 실패:", err);
        });

        // 권한 확보 후 이벤트 제거 (불필요한 실행 방지)
        document.removeEventListener("click", initSound);
        document.removeEventListener("keydown", initSound);
    }

// 어떤 버튼 클릭이든, 키보드 입력이든 처음 1번만 initSound 실행
    document.addEventListener("click", initSound);
    document.addEventListener("keydown", initSound);
});

