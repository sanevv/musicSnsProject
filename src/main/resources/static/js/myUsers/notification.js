(function () {
	const contextPath =
		window.ctxPath ||
		document.querySelector('meta[name="ctxPath"]')?.content ||
		'';

	// 인증 헤더 만들기
	function buildAuthHeader() {
		try {
			const h = window.AuthFunc?.getAuthHeader?.();
			if (h && Object.keys(h).length) return h;
		} catch (e) {}
		const token = localStorage.getItem('accessToken');
		const type = localStorage.getItem('tokenType') || 'Bearer';
		return token ? { Authorization: `${type} ${token}` } : {};
	}

	// 토큰 보유 여부
	function hasAuthToken() {
		const h = buildAuthHeader();
		return !!h.Authorization;
	}

	function getJson(url, params) {
		return $.ajax({
			url: url,
			type: 'GET',
			data: params || {},
			headers: buildAuthHeader(),
			dataType: 'json'
		});
	}

	// 토큰 만료시, 한 번만 새 토큰 받고, 같은 요청 다시 시도
	function withAuthRetry(run) {
		const dfd = $.Deferred();
		let retried = false;

		function attempt() {
			run()
				.done((res) => dfd.resolve(res))
				.fail((xhr, t, e) => {
					const status = xhr?.status;
					console.warn('[notification] request fail', { status, t, e, xhr });
					if (status == 401 && !retried) {
						retried = true;
						const refresh = AuthFunc.refreshAuthToken;
						if (typeof refresh == 'function') {
							$.when(refresh()).done(attempt).fail(() => dfd.reject(xhr, t, e));
						} else {
							dfd.reject(xhr, t, e);
						}
						return;
					}
					dfd.reject(xhr, t, e);
				});
		}
		attempt();
		return dfd.promise();
	}

	// 로컬 상태 키들
	const KEY_LAST_READ = 'notif_last_read_ms';
	const KEY_HIDDEN_BEFORE = 'notif_hidden_before_ms';
	const KEY_DISMISSED = 'notif_dismissed_keys';
	const KEY_CLICKED_READ = 'notif_clicked_read_keys';

	// 마지막 읽음시각
	function setLastRead(ms) { localStorage.setItem(KEY_LAST_READ, String(ms)); }

	// 일괄삭제 시각 
	function setHiddenBefore(ms) { localStorage.setItem(KEY_HIDDEN_BEFORE, String(ms)); }

	function getSet(key) {
		try {
			const raw = localStorage.getItem(key);
			return raw ? new Set(JSON.parse(raw)) : new Set();
		} catch { return new Set(); }
	}
	function saveSet(key, set) { localStorage.setItem(key, JSON.stringify(Array.from(set))); }

	// 개별 삭제키
	function getDismissed() { return getSet(KEY_DISMISSED); }
	function addDismissed(k) { const s = getDismissed(); s.add(k); saveSet(KEY_DISMISSED, s); }
	function clearDismissed() { localStorage.removeItem(KEY_DISMISSED); }

	// 개별 읽음키
	function getClickedRead() { return getSet(KEY_CLICKED_READ); }
	function addClickedRead(k) { const s = getClickedRead(); s.add(k); saveSet(KEY_CLICKED_READ, s); }
	function clearClickedRead() { localStorage.removeItem(KEY_CLICKED_READ); }

	// DOM 엘리먼트 참조
	function getDom() {
		const $layer = $('#notiLayer');
		const $list = $layer.find('#notiList');
		const $badge = $('#notiBadge');
		return { $layer, $list, $badge };
	}

	// 상태값
	let isLoading = false;
	const pageSize = 300;

	// 배지 갱신
	function updateBadge(count) {
		const { $badge } = getDom();
		if (count > 0) $badge.text(count).show();
		else $badge.hide();
	}

	// 빈 목록 렌더
	function renderEmpty(text) {
		const { $list } = getDom();
		$list.html(`<li class="noti-empty text-muted">${text}</li>`);
	}

	// 그룹명(오늘/어제/이번 주/이번 달/이전)
	function dayStart(d) { const x = new Date(d); x.setHours(0,0,0,0); return x.getTime(); }
	function groupLabel(ms) {
		const now = new Date();
		const today0 = dayStart(now);
		const yesterday0 = today0 - 24*60*60*1000;

		// 주 시작(월요일 00:00)
		const sow = (function () {
			const x = new Date(now);
			const dow = x.getDay() || 7; // 일=0 → 7
			if (dow != 1) x.setDate(x.getDate() - (dow - 1));
			x.setHours(0,0,0,0);
			return x.getTime();
		})();

		// 월 시작(1일 00:00)
		const som = (function () {
			const x = new Date(now.getFullYear(), now.getMonth(), 1);
			x.setHours(0,0,0,0);
			return x.getTime();
		})();

		if (ms >= today0) return '오늘';
		if (ms >= yesterday0) return '어제';
		if (ms >= sow) return '이번 주';
		if (ms >= som) return '이번 달';
		return '이전';
	}

	// 개별 아이템
	function renderItem(item, isUnread) {
		const profile = item.actorProfileImage || (contextPath + '/images/default_profile.png');

		let action = ' 알림';
		if (item.eventType == 'FOLLOW') action = '님이 회원님을 팔로우했습니다.';
		if (item.eventType == 'LIKE') action = '님이 회원님의 게시물을 좋아합니다.';
		if (item.eventType == 'COMMENT') action = '님이 댓글을 남겼습니다.';

		const cls = isUnread ? 'noti-item unread' : 'noti-item read';
		const dot = isUnread ? '<span class="noti-dot" aria-hidden="true"></span>' : '';

		return `
			<li class="${cls}" data-eventkey="${item.eventKey}" data-created="${item.createdAt}">
				<img class="noti-avatar" src="${profile}" alt="">
				<div class="noti-content">
					<div class="noti-text">
						<span class="actor-name">${item.actorNickname}</span><span class="noti-action">${action}</span>
					</div>
					<div class="noti-time">${item.timeLabel}</div>
				</div>
				${dot}
				<button type="button" class="noti-delete" aria-label="삭제">&times;</button>
			</li>`;
	}

	// 그룹 구분 라벨
	function renderSection(title) {
		return `<li class="noti-section">${title}</li>`;
	}

	// 알림 로드
	function loadNotifications(reset) {
		if (isLoading) return;
		isLoading = true;

		if (!hasAuthToken()) {
			console.warn('[notification] Authorization 헤더 없음. localStorage(accessToken/tokenType) 확인 필요');
			if (reset) renderEmpty('로그인이 필요합니다.');
			updateBadge(0);
			isLoading = false;
			return;
		}

		withAuthRetry(() => getJson(`${contextPath}/api/notification`, { page: 1, size: pageSize }))
			.done((res) => {
				const items = res?.items || [];
				const { $list } = getDom();

				if (reset) $list.empty();
				if (!items.length) {
					if (reset) renderEmpty('알림이 없습니다.');
					updateBadge(0);
					return;
				}

				const serverUnread = Number(res?.unread || 0);

				let currentGroup = '';
				let unreadCount = 0;
				const html = [];

				items.forEach((it) => {
					const gl = groupLabel(it.createdAt);
					if (gl != currentGroup) {
						currentGroup = gl;
						html.push(renderSection(gl));
					}

					// 읽지 않음 여부는 서버 isUnread만 사용
					const isUnread = !!it.isUnread;
					if (isUnread) unreadCount++;
					html.push(renderItem(it, isUnread));
				});

				if (html.length == 0 && reset) {
					renderEmpty('알림이 없습니다.');
					updateBadge(0);
				} else {
					$list.append(html.join(''));
					updateBadge(serverUnread);
				}
			})
			.fail((xhr) => {
				const status = xhr?.status;
				if (status == 401) {
					renderEmpty('로그인이 필요합니다. 다시 로그인해 주세요.');
					updateBadge(0);
				} else {
					const msg = xhr?.responseJSON?.message || xhr?.statusText || '알 수 없는 오류';
					renderEmpty(`알림을 불러오지 못했습니다. (${status || 'ERR'}) ${msg}`);
					updateBadge(0);
				}
			})
			.always(() => { isLoading = false; });
	}

	// 이벤트 바인딩
	$(function () {
		// 알림 열기
		$(document).on('click', '.btn.noti', function () {
			// const target = $(this).data('target');
			// $('.aside-navigation-layer').removeClass('on');
			// $('#' + target).addClass('on');
			loadNotifications(true);
		});

		// 모두 읽음
		$(document).on('click', '#btnNotiMarkAllRead', function () {
			$.ajax({ url: `${contextPath}/api/notification/read-all`, type: 'POST', headers: buildAuthHeader() })
				.done(() => {
					setLastRead(Date.now());
					clearClickedRead();
					const { $list } = getDom();
					$list.find('.noti-item.unread').each(function () {
						$(this).removeClass('unread').addClass('read');
						$(this).find('.noti-dot').remove();
					});
					updateBadge(0);
				})
				.fail((xhr) => {
					alert('모두 읽음 처리에 실패했습니다. 잠시 후 다시 시도해 주세요. (' + (xhr?.status || 'ERR') + ')');
				});
		});

		// 개별 삭제
		$(document).on('click', '.noti-delete', function (e) {
			e.stopPropagation();
			const $item = $(this).closest('.noti-item');
			const eventKey = $item.data('eventkey');

			if (!confirm('이 알림을 삭제하시겠습니까?')) return;

			$.ajax({
				url: `${contextPath}/api/notification/one`,
				type: 'DELETE',
				data: { eventKey: eventKey },
				headers: buildAuthHeader()
			})
			.done(() => {
				addDismissed(String(eventKey));
				// 배지 줄이기 (읽지 않은 항목을 지운 경우)
				if ($item.hasClass('unread')) {
					const { $badge } = getDom();
					const cur = parseInt(($badge.text() || '0'), 10) || 0;
					if (cur > 0) updateBadge(cur - 1);
				}
				$item.remove();
			})
			.fail((xhr) => {
				if ((xhr?.status || 0) == 404) {
					addDismissed(String(eventKey));
					if ($item.hasClass('unread')) {
						const { $badge } = getDom();
						const cur = parseInt(($badge.text() || '0'), 10) || 0;
						if (cur > 0) updateBadge(cur - 1);
					}
					$item.remove();
					return;
				}
				alert('삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.');
			});
		});

		// 전체 삭제
		$(document).on('click', '#btnNotiDeleteAll', function () {
			if (!confirm('알림을 모두 삭제하시겠습니까?')) return;
			$.ajax({ url: `${contextPath}/api/notification/all`, type: 'DELETE', headers: buildAuthHeader() })
				.done(() => {
					const now = Date.now();
					setHiddenBefore(now);
					clearDismissed();
					clearClickedRead();
					setLastRead(now);
					renderEmpty('알림이 없습니다.');
					updateBadge(0);
				})
				.fail((xhr) => {
					alert('전체 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요. (' + (xhr?.status || 'ERR') + ')');
				});
		});

		// 개별 읽음
		$(document).on('click', '#notiList .noti-item', function () {
			const $li = $(this);
			if ($li.hasClass('read')) return;

			const key = String($li.data('eventkey') || '');
			if (key) addClickedRead(key);

			$li.removeClass('unread').addClass('read');
			$li.find('.noti-dot').remove();

			const { $badge } = getDom();
			const cur = parseInt(($badge.text() || '0'), 10) || 0;
			if (cur > 0) updateBadge(cur - 1);

			$.ajax({ url: `${contextPath}/api/notification/read-one`, type: 'POST', data: { eventKey: key }, headers: buildAuthHeader() });
		});

		// 초기 로드
		loadNotifications(true);
	});
})();
