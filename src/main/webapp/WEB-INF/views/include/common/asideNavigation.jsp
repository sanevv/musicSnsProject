<%@ page contentType="text/html;charset=UTF-8" language="java"%>
<% String ctxPath= request.getContextPath(); %>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>

<meta name="ctxPath" content="<%=ctxPath%>">

<link rel="stylesheet" href="<%=ctxPath%>/css/profile.css" />
<link rel="stylesheet" href="<%=ctxPath%>/css/music/search/search.css" />
<link rel="stylesheet" href="<%=ctxPath%>/css/users/notification.css" />

<%--<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>--%>
<script src="https://cdn.jsdelivr.net/npm/sockjs-client/dist/sockjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/stompjs/lib/stomp.min.js"></script>

<script type="text/javascript" src="<%=ctxPath%>/js/music/search/search.js"></script>
<script type="text/javascript" src="<%=ctxPath%>/js/myUsers/notification.js" defer></script>
<script type="text/javascript" src="<%=ctxPath%>/js/myUsers/sideUserInfo.js"></script>

<style type="text/css">

	button,button:focus { outline: none;}

</style>

<script type="text/javascript">
	(function () {
		var ctxPath =
			window.ctxPath ||
			(document.querySelector('meta[name="ctxPath"]') &&
				document.querySelector('meta[name="ctxPath"]').content) ||
			'';
		var basePath = ctxPath;

		// 인증 헤더 만들기
		function buildAuthHeaders() {
			try {
				var appHeaders =
					window.AuthFunc &&
					window.AuthFunc.getAuthHeader &&
					window.AuthFunc.getAuthHeader();
				if (appHeaders && typeof appHeaders == 'object' && Object.keys(appHeaders).length > 0) {
					if (!('X-Requested-With' in appHeaders)) appHeaders['X-Requested-With'] = 'XMLHttpRequest';
					return appHeaders;
				}
			} catch (e) {}
			var token = localStorage.getItem('accessToken');
			var type = localStorage.getItem('tokenType') || 'Bearer';
			var headers = { 'X-Requested-With': 'XMLHttpRequest' };
			if (token) headers.Authorization = type + ' ' + token;
			return headers;
		}

	  // ADMIN 여부 확인: /api/auth/authorize-test (SecurityConfig에서 hasRole("ADMIN"))
	  $.ajax({
	    url: ctxPath + '/api/auth/authorize-test',
	    method: 'GET',
	    headers: buildAuthHeader(),
	    dataType: 'json'
	  })
	  .done(function () {
	    // 200 이면 ADMIN
	    var el = document.getElementById('adminStatsItem');
	    if (el) el.style.display = ''; // 표시
	  })
	  .fail(function () {
	    // 401/403/기타 → 그대로 숨김
	  });
	})();
</script>

<!-- 왼쪽 네비게이션 사이드바 -->
<div class="aside-navigation sidebar">
	<div class="inner">
		<a href="<%=ctxPath%>/index" class="btn-logo"><span class="blind">홈으로가기</span></a>
		<ul class="navigation-list">
			<li>
				<button type="button" class="btn home"
					onclick="location.href='<%=ctxPath%>/index'">홈</button>
			</li>
			<li>
				<button type="button" class="btn search" data-target="#searchLayer">검색</button>
			</li>
			<li>
				<button type="button" class="btn chart"
					onclick="location.href='<%=ctxPath%>/music/chart'">플리</button>
			</li>
			<li id="adminStatsItem" style="display:none;">
			  	<button type="button" class="btn adminstats"
			    	onclick="location.href='<%=ctxPath%>/admin/stats'">통계</button>
			</li>
			<li>
				<button type="button" class="btn noti" data-target="#notiLayer">알림</button>
			</li>
			<li>
				<button type="button" class="btn profile" data-target="#profileLayer">프로필</button>
			</li>
			<!-- <li>
				<button type="button" class="btn setting">설정</button>
			</li> -->
			<li>
				<button type="button" class="btn post" data-toggle="modal" data-target="#postModal">게시물작성</button>
			</li>
			<li>
				<button type="button" class="btn music"
					onclick="location.href='<%=ctxPath%>/mypage/purchase/list'">구매리스트</button>
			</li>
			<li>
				<button type="button" class="btn cart"
					onclick="location.href='<%=ctxPath%>/cart/list'">장바구니</button>
			</li>
		</ul>
	</div>
</div>
<!-- 왼쪽 네비게이션 사이드바 -->

<!-- 클릭했을 때 나오는 팝업 -->
<div id="searchLayer" class="aside-navigation-layer sidebar">
	<div class="inner">
		<form id="sideSearchForm"
			action="${pageContext.request.contextPath}/music/search" method="get"
			class="search-container">
			<div class="search-top">
				<label for="sideSearchCategory"></label> <select name="searchType"
					id="sideSearchCategory" class="search-select">
					<option value="all">전체</option>
					<option value="track">제목</option>
					<option value="artist">아티스트</option>
					<option value="album">앨범</option>
				</select> <label for="sideSearchKeyword"></label> <input type="text"
					name="keyword" id="sideSearchKeyword" class="search-input"
					placeholder="검색어를 입력하세요">
			</div>
			<button type="submit" class="search-btn">검색</button>
		</form>
		<!-- 추천 섹션 -->
		<div class="side-recommend-section">
			<!-- 인기 검색어 -->
			<div class="side-popular-keywords">
				<h4 class="side-section-title">인기 검색어</h4>
				<div id="keywordList" class="side-keyword-list"></div>
			</div>

			<!-- 추천 곡 -->
			<div class="side-recommend-tracks">
				<h4 class="side-section-title">추천 곡</h4>
				<div id="trackList" class="side-track-list"></div>
			</div>
		</div>
	</div>
</div>
<!-- 알림 -->
<div id="notiLayer" class="aside-navigation-layer sidebar">
	<div class="inner">
		<div class="noti-header">
			<div class="noti-title-wrap">
				<span class="noti-title">알림</span>
				<span id="notiBadge" class="badge bg-danger" style="display:none;">0</span>
			</div>
			<div class="noti-header-actions">
				<button type="button" id="btnNotiMarkAllRead" class="btn btn-light btn-sm">모두 읽음</button>
				<button type="button" id="btnNotiDeleteAll" class="btn btn-outline-danger btn-sm">전체 삭제</button>
			</div>
		</div>

		<!-- 알림 목록 -->
		<ul id="notiList" class="noti-list"></ul>
	</div>
</div>
<!-- 알림 레이어 -->

<div id="profileLayer" class="aside-navigation-layer sidebar"></div>
<!-- 클릭했을 때 나오는 팝업 -->
<link href="<%=ctxPath%>/css/chat/chat.css" rel="stylesheet" />
<div class="fixed-talk">
	<button type="button" id="btnTalk" class="btn-talk">메시지</button>
</div>

<!-- 채팅 모달 -->
<div class="modal fade" id="chatModal" tabindex="-1" aria-hidden="true">
	<div class="modal-dialog modal-dialog-slide modal-sm">
		<div class="modal-content chat-modal-content">
			<div class="modal-header">
				<h5 class="modal-title">Muodle Talk</h5>
				<button type="button" class="modal-close-btn"
					data-bs-dismiss="modal" aria-label="닫기">
					<i class="bi bi-x"></i>
				</button>
			</div>
			<div class="modal-body p-0">
				<ul class="list-group list-group-flush chat-room-list"
					id="chatRoomList">
					<!-- JS로 채팅방 리스트가 렌더링됨 -->
				</ul>
			</div>
		</div>
	</div>
</div>
<%--채팅방 내부 모달--%>
<!-- 채팅방 모달 -->
<div class="modal fade" id="chatRoomModal" tabindex="-1"
	aria-hidden="true">
	<div class="modal-dialog modal-dialog-slide modal-sm" id="chatRoomDialog">
		<div class="modal-content chat-room-modal-content">
			<div class="modal-header">
				<div class="chat-participants-info">
					<div class="participants-images" id="chatRoomParticipantImages">
						<!-- JS로 참여자 프로필 이미지들이 렌더링됨 -->
					</div>
					<div class="participants-names" id="chatRoomParticipantNames">
						<!-- JS로 참여자 이름들이 렌더링됨 -->
					</div>
				</div>
				<button type="button" class="modal-close-btn"
					data-bs-dismiss="modal" aria-label="닫기">
					<i class="bi bi-x"></i>
				</button>
			</div>
			<div class="modal-body p-0">
				<div class="chat-messages-container" id="chatRoomMessages">
					<!-- JS로 메시지들이 렌더링됨 -->
				</div>
				<div class="chat-input-container">
					<textarea id="chatMessageInput" class="chat-input"
						placeholder="메시지를 입력하세요..." rows="1"
						onkeydown="handleChatInputKeydown(event)"></textarea>
					<button type="button" class="chat-send-btn"
						onclick="sendChatMessage()">
						<i class="bi bi-send-fill"></i>
					</button>
				</div>
			</div>
		</div>
	</div>
</div>



<!-- 프로필 확대 모달 -->
<div class="modal fade" id="profileImageModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content simple-profile-modal">
            <div class="modal-body simple-profile-body">
                <div class="profile-image-overlay">
                    <img id="profileImageModalImg" class="simple-profile-image" alt="프로필 이미지">
                    <div class="profile-overlay-info">
                        <h3 id="profileModalNickname" class="overlay-nickname"></h3>
                        <p id="profileModalMessage" class="overlay-message"></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>


<script src="<%=ctxPath%>/js/chat/chat.js" defer></script>
<%--<div id="talkLayer" class="layer">--%>
<%--    <div class="layer-header">--%>
<%--        <h3 class="layer-title">메시지</h3>--%>
<%--        <button type="button" id="btnTalkClose" class="layer-close">X</button>--%>
<%--    </div>--%>
<%--    <div class="layer-body">--%>
<%--        <ul class="talk-list">--%>
<%--            <li>--%>
<%--                <div class="talk-img">--%>
<%--                    <img src="<%= ctxPath%>/images/emotion/angry.png" alt="사용자 프로필 이미지" />--%>
<%--                </div>--%>
<%--                <div class="talk-info">--%>
<%--                    <p class="talk-title">HanBinId</p>--%>
<%--                    <p class="talk-text">7강의실 아이돌 한빈</p>--%>
<%--                </div>--%>
<%--            </li>--%>
<%--            <li>--%>
<%--                <div class="talk-img">--%>
<%--                    <img src="<%= ctxPath%>/images/emotion/angry.png" alt="사용자 프로필 이미지" />--%>
<%--                </div>--%>
<%--                <div class="talk-info">--%>
<%--                    <p class="talk-title">HanBinId</p>--%>
<%--                    <p class="talk-text">7강의실 아이돌 한빈</p>--%>
<%--                </div>--%>
<%--            </li>--%>
<%--            <li>--%>
<%--                <div class="talk-img">--%>
<%--                </div>--%>
<%--                <div class="talk-info">--%>
<%--                    <p class="talk-title">HanBinId</p>--%>
<%--                    <p class="talk-text">7강의실 아이돌 한빈</p>--%>
<%--                </div>--%>
<%--            </li>--%>
<%--            <li>--%>
<%--                <div class="talk-img">--%>
<%--                </div>--%>
<%--                <div class="talk-info">--%>
<%--                    <p class="talk-title">HanBinId</p>--%>
<%--                    <p class="talk-text">7강의실 아이돌 한빈</p>--%>
<%--                </div>--%>
<%--            </li>--%>
<%--            <li>--%>
<%--                <div class="talk-img">--%>
<%--                </div>--%>
<%--                <div class="talk-info">--%>
<%--                    <p class="talk-title">HanBinId</p>--%>
<%--                    <p class="talk-text">7강의실 아이돌 한빈</p>--%>
<%--                </div>--%>
<%--            </li>--%>
<%--            <li>--%>
<%--                <div class="talk-img">--%>
<%--                </div>--%>
<%--                <div class="talk-info">--%>
<%--                    <p class="talk-title">HanBinId</p>--%>
<%--                    <p class="talk-text">7강의실 아이돌 한빈</p>--%>
<%--                </div>--%>
<%--            </li>--%>
<%--            <li>--%>
<%--                <div class="talk-img">--%>
<%--                </div>--%>
<%--                <div class="talk-info">--%>
<%--                    <p class="talk-title">HanBinId</p>--%>
<%--                    <p class="talk-text">7강의실 아이돌 한빈</p>--%>
<%--                </div>--%>
<%--            </li>--%>
<%--            <li>--%>
<%--                <div class="talk-img">--%>
<%--                </div>--%>
<%--                <div class="talk-info">--%>
<%--                    <p class="talk-title">HanBinId</p>--%>
<%--                    <p class="talk-text">7강의실 아이돌 한빈</p>--%>
<%--                </div>--%>
<%--            </li>--%>
<%--            <li>--%>
<%--                <div class="talk-img">--%>
<%--                </div>--%>
<%--                <div class="talk-info">--%>
<%--                    <p class="talk-title">HanBinId</p>--%>
<%--                    <p class="talk-text">7강의실 아이돌 한빈</p>--%>
<%--                </div>--%>
<%--            </li>--%>
<%--            <li>--%>
<%--                <div class="talk-img">--%>
<%--                </div>--%>
<%--                <div class="talk-info">--%>
<%--                    <p class="talk-title">HanBinId</p>--%>
<%--                    <p class="talk-text">7강의실 아이돌 한빈</p>--%>
<%--                </div>--%>
<%--            </li>--%>
<%--        </ul>--%>
<%--    </div>--%>
<%--</div>--%>



<!-- post 모달 -->
<div class="modal fade" id="postModal" tabindex="-1"
	aria-labelledby="postModalLabel" aria-hidden="true">
	<div class="modal-dialog modal-dialog-centered modal-lg">
		<div class="modal-content">

			<!-- 헤더 -->
			<div class="modal-header">
				<h5 class="modal-title" id="postModalLabel">새 게시물 만들기</h5>
				<button type="button" class="close" data-dismiss="modal"
					aria-label="닫기">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>

			<!-- 바디 -->
			<div class="modal-body text-center">

				<!-- STEP 1 -->
				<div class="post_step1">
					<div class="emotions">
						<!-- class active 추가 시 활성화 -->
						<button type="button" class="btn natural active" value="CALM">
							<span class="blind">평온</span>
						</button>
						<button type="button" class="btn happy" value="HAPPY">
							<span class="blind">행복</span>
						</button>
						<button type="button" class="btn love" value="LOVE">
							<span class="blind">사랑</span>
						</button>
						<button type="button" class="btn sad" value="SAD">
							<span class="blind">우울</span>
						</button>
						<button type="button" class="btn angry" value="ANGRY">
							<span class="blind">분노</span>
						</button>
						<button type="button" class="btn tire" value="TIRED">
							<span class="blind">힘듬</span>
						</button>
					</div>
				</div>

				<div id="step1" style="width: 500px; margin: 5% auto;">
					<textarea id="title" name="title" class="form-control mb-3"
						rows="1" cols="1" placeholder="제목을 입력하세요..."></textarea>
					<textarea class="form-control mb-3" id="contents" name="contents"
						rows="4" placeholder="문구를 입력하세요..."></textarea>
					<div class="d-flex justify-content-between">
						<button type="button" class="btn btn-primary" id="btnNext">다음</button>
						<button type="button" class="btn btn-primary" id="btnUploadStep1"
							data-context-path="${pageContext.request.contextPath}">올리기</button>
					</div>
				</div>

				<!-- STEP 2 -->
				<div id="step2" style="display: none;">
					<button type="button" class="btn btn-primary mb-3" id="imageSave">이미지저장</button>
					<div id="selectImageDelete"></div>
					<div id="tui-image-editor" style="height: 500px;"></div>
					<button type="button" class="btn btn-danger mr-3 mt-3"
						id="btnBeforeStep2">이전</button>
					<button type="button" class="btn btn-primary mt-3"
						id="btnNextStep2">다음</button>
				</div>

				<%-- STEP 3 --%>
				<div id="step3" style="display: none;">
					<div id="previewCarousel" class="carousel slide mt-3"
						data-ride="carousel" data-interval="3000"
						style="width: 500px; height: 500px; margin: auto;">
						<ol class="carousel-indicators"></ol>
						<div class="carousel-inner"
							style="width: 100%; height: 100%; background: #000;">
							<!-- 자바스크립트로 슬라이드 아이템 주입 -->
						</div>
						<a class="carousel-control-prev" href="#previewCarousel"
							role="button" data-slide="prev"> <span
							class="carousel-control-prev-icon" aria-hidden="true"></span> <span
							class="sr-only">이전</span>
						</a> <a class="carousel-control-next" href="#previewCarousel"
							role="button" data-slide="next"> <span
							class="carousel-control-next-icon" aria-hidden="true"></span> <span
							class="sr-only">다음</span>
						</a>
					</div>

					<div class="mt-3" style="width: 500px; height: 100px; margin: auto">
						<h3 class="mb-4" id="previewTitle"
							style="text-align: left; font-weight: bold"></h3>
						<p id="previewText" style="text-align: left"></p>
					</div>
					<button type="button" class="btn btn-danger mr-3 mt-5 mb-4"
						id="btnBeforeStep3">이전</button>
					<button type="button" id="btnUploadStep3"
						class="btn btn-primary mt-5 mb-4"
						data-context-path="${pageContext.request.contextPath}">올리기</button>
				</div>


			</div>
		</div>
	</div>
</div>
<%-- 여기까지 post 모달 --%>