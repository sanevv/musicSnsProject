$(function() {

	getUserInfo();



}); // end of function (){} ---

function getUserInfo() {
	const authHeader = AuthFunc.getAuthHeader;
	const apiRequest = AuthFunc.apiRequest;

	const params = new URLSearchParams(window.location.search);
	const targetUserId = params.get("targetUserId");
	// 프로필 정보 가져오기
	apiRequest(() =>
			new Promise((resolve, reject) => {
				$.ajax({
					url: '/api/userInfo/getInfo',
					headers: authHeader(),
					data: { "targetUserId": targetUserId },
					dataType: 'json',
					success: function(json) {
						resolve(json);
					},
					error: function (xhr, textStatus, errorThrown) {


					    // axios 스타일의 에러 객체로 변환
					    const error = new Error(errorThrown || textStatus);
					    error.response = {
					        status: xhr.status,
					        statusText: xhr.statusText,
					        data: xhr.responseJSON || xhr.responseText
					    };
					    error.request = xhr;
					    reject(error);
					}
				})
			})
		).then((json) => {
			const profile = $('div.profile-top');
			userId = json.userId;

			const button = $(".profile-btns");
			let b_html = "";


			v_html = `<!-- 상단 프로필 --> 
				                    <div class="profile-img-wrap"> 
				                        <img src="${json.myuser.profile_image}" class="profile-img" alt=""> 
				                    </div> 	
				                    
				                    <div id="user_info"> 
				                    	<div class="mb-3" style="display:flex; align-items:center; gap:10px;">
					                        <h2>${json.myuser.nickname} </h2>`;
			if (targetUserId == null || targetUserId == '') {
				v_html += `
				                        <button class="coin ml-2" onclick="location.href='/mypage/eumpyo/charge'">
				                        <span class="coin-text">${json.myuser.coin}</span>
				                        <img src='${ctxPath}/images/mypage/eumpyo.png' alt='coin' class="coin-icon">
				                    	</button>
										`
			}
			v_html += `
				                    	</div>
				                    	
				                        <div class="profile-stats mb-3">
				                            <div class="text-center mr-1"> 
				                                <span style="font-weight: 600; font-size: 14pt">게시물</span>
				                                <strong class="mr-2">${json.myuser.postCount}</strong>
				                            </div> 
				                            <div class="mr-3 text-center"> 
				                                <span style="font-weight: 600; font-size: 14pt">팔로워</span>`;
			if (targetUserId == null || targetUserId == '') {
				v_html += `<a href="/mypage/myFollowers" class="text-dark text-center">
							                                    <strong class="mr-2">${json.myuser.followeeCount}</strong>
							                                </a> 
							                            </div> 
							                            <div class="text-center"> 
							                                <span style="font-weight: 600; font-size: 14pt">팔로우</span>
							                                <a href="/mypage/myFollowers" class="text-dark text-center"> 
							                                    <strong class="mr-2">${json.myuser.followerCount}</strong>
							                                </a> 
							                            </div>`;
			}
			else {
				v_html += `<a href="/mypage/myFollowers?targetUserId=${targetUserId}" class="text-dark text-center">
							                                    <strong class="mr-2">${json.myuser.followeeCount}</strong>
							                                </a> 
							                            </div> 
							                            <div class="text-center"> 
							                                <span style="font-weight: 600; font-size: 14pt">팔로우</span>
							                                <a href="/mypage/myFollowers?targetUserId=${targetUserId}" class="text-dark text-center"> 
							                                    <strong class="mr-2">${json.myuser.followerCount}</strong>
							                                </a> 
							                            </div>`;
			}

			v_html += `
				                        </div> 
				                        <div class="my-3">${json.myuser.username}</div>`;

			if (json.myuser.profileMessage != null) {
				v_html += `<p class="mb-0 text-muted">${json.myuser.profileMessage}</p>`;
			} else {
				v_html += `<p class="mb-0 text-muted">상태메세지 없음</p>`;
			}

			v_html += `</div>`;
			profile.html(v_html);


			if (targetUserId == null || targetUserId == '') {
				// 내 프로필일 때
				b_html += `
				                        <button class="btn custom-btn" onclick="location.href='/mypage/updateInfo'">프로필 편집</button>
				                        <button type="button" class="btn custom-btn" data-toggle="modal" data-target="#postModal">글쓰기</button>
				                        <button class="btn custom-btn" onclick="location.href='/cart/list'">장바구니</button>

				                        <div class="dropdown">
				                            <button class="btn custom-btn dropdown-toggle" type="button"
				                                id="dropdownMenuButton" data-toggle="dropdown"
				                                aria-haspopup="true" aria-expanded="false">
				                                ...
				                            </button>
				                            <div class="dropdown-menu dropdown-menu-right shadow-sm"
				                                aria-labelledby="dropdownMenuButton"
				                                style="min-width: 150px; border-radius: 10px;">
				                                <a class="dropdown-item" href="#" style="color:black" data-toggle="modal" data-target="#blockedUser">차단유저</a>
				                                <a class="dropdown-item text-danger font-weight-bold" onclick="logout()">로그아웃</a>
				                            </div>
				                        </div>
				                    `;
			} else {
				// 다른 사람 프로필일 때
				if (json.follow) {
					b_html += `<button class="btn custom-btn" onclick="unfollow(${targetUserId})">팔로우 취소</button>`;
				}
				else {
					b_html += `<button class="btn custom-btn" onclick="gofollow(${targetUserId})">팔로우</button>`;
				}

				b_html += `
				                        <button class="btn custom-btn" onclick="#">메시지</button>
				                        <button class="btn custom-btn" onclick="block(${targetUserId})">차단</button>
				                    `;
			}

			button.html(b_html);


			getUserPost();
		}).catch((error) => {
			alert("프로필 불러오기 실패")
		});




		$('#blockedUser').on('shown.bs.modal', function() {
			blockList();
		});
}



function logout(){
    AuthFunc.logout().then((data) => {
        console.log(data);
        alert('로그아웃 되었습니다.');
        window.location.href = ctxPath + '/auth/login';
    }).catch((error) => {
        console.error('Logout failed:', error);
        alert('로그아웃에 실패했습니다. 다시 시도해주세요.');
    });
}


function getUserPost() {
	const authHeader = AuthFunc.getAuthHeader;
	const apiRequest = AuthFunc.apiRequest;
	const params = new URLSearchParams(window.location.search);
	const targetUserId = params.get("targetUserId");


	return apiRequest(() =>
		new Promise((resolve, reject) => {
			$.ajax({
				url: "/api/userInfo/post",
				headers: authHeader(),
				data: { "targetUserId": targetUserId },
				dataType: "json",
				success: function(json) {
					resolve(json);
				},
				error: function(request, status, error) {
					console.error("게시물 불러오기 실패:", request.responseText);
				}
			})
		})).then((json) => {
			let post = $('.post-list');
			post.empty();

			if (!json || json.length === 0) {

				if (targetUserId == null || targetUserId == '') {
					post.html(
						'<div class="empty-posts">' +
						'<p class="mb-1">작성하신 게시물이 없습니다.</p>' +
						'<a class="btn post" data-toggle="modal" data-target="#postModal">첫 게시물을 만들어보세요.</a>' +
						'</div>'
					);
				}
				else {
					post.html(
						'<div class="empty-posts">' +
						'<p class="mb-1">게시물이 없습니다.</p>' +
						'</div>'
					);
				}
			} else {
				let html = '<div class="post-grid">';
				json.forEach(item => {
					let images = Array.isArray(item.postImageUrl) ? item.postImageUrl : (item.postImageUrl ? [item.postImageUrl] : []);
					if (images.length === 0) {
						html += `<div class="post-item no-image post-img" >${item.title || ''}</div>`;
					} else {
						html += `<div class="post-item post-img"><img src="${images[0]}" alt="post image"></div>`;
					}
				});
				html += '</div>';
				post.html(html);
			}
		}).catch((error) => {
			alert("게시물 불러오기 실패")
		});
}




// 팔로우 하기
function gofollow(userId) {
    const authHeader = AuthFunc.getAuthHeader;
    const apiRequest = AuthFunc.apiRequest;

    return apiRequest(() =>
   	 new Promise((resolve, reject) => {
            $.ajax({
                url:  '/api/follow/addFollow',
                headers: authHeader(),
                data: {
                    'followee': userId
                },
                dataType: "json",
                success: function (json) {
					resolve(json);

                },
                error: function (xhr, textStatus, errorThrown) {


                    // axios 스타일의 에러 객체로 변환
                    const error = new Error(errorThrown || textStatus);
                    error.response = {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        data: xhr.responseJSON || xhr.responseText
                    };
                    error.request = xhr;
                    reject(error);
                }
            })

        })).then((json) => {
			alert("팔로우 완료");
			getUserInfo();
			getCounts();
		}). catch((error) => {

		});
}

// 언팔로우 하기
function unfollow(userId) {

    const authHeader = AuthFunc.getAuthHeader;
    const apiRequest = AuthFunc.apiRequest;

    return apiRequest(() =>
    	new Promise((resolve, reject) => {
            $.ajax({
                url:  '/api/follow/unFollow',
                headers: authHeader(),
                data: {
                    'followee': userId
                },
                dataType: "json",
                success: function (json) {
					resolve(json);

                },
                error: function (xhr, textStatus, errorThrown) {


                    // axios 스타일의 에러 객체로 변환
                    const error = new Error(errorThrown || textStatus);
                    error.response = {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        data: xhr.responseJSON || xhr.responseText
                    };
                    error.request = xhr;
                    reject(error);
                }
            })

        })).then((json) => {
			alert("언팔 완료");
			getUserInfo();
			getCounts();
		}).catch((error) => {

		});


} // end of function unfollow(userId) {} ------------

function blockList() {
	const authHeader = AuthFunc.getAuthHeader;
	const apiRequest = AuthFunc.apiRequest;

	apiRequest(() =>
		new Promise((resolve, reject) => {
			$.ajax({
				url: '/api/follow/blockedList',
				headers: authHeader(),
				dataType: "json",
				success: function(json) {
					resolve(json);

				},
				error: function(xhr) {
					$(".blocked-list").html("<p class='text-danger'>불러오기 실패</p>");
				}
			})
		})
	).then((json) => {

		let v_html = ``;
		if (!json || json.length === 0) {
			v_html = `<p class='text-center text-muted'>차단한 유저가 없습니다.</p>`;
		} else {
			v_html = `<div class="list-group">`;
			json.forEach(user => {
				v_html += `
		            <div class="list-group-item d-flex align-items-center gap-3 py-3">
		                <img src="${user.profile_image}" alt="profile" class="rounded-circle" width="50" height="50" style="object-fit: cover;">
		                <div class="flex-grow-1">
		                    <div class="fw-bold">${user.nickname}</div>
		                    <small class="text-muted">${user.email}</small>
		                </div>
		                <button class="btn btn-sm btn-outline-danger" onclick="unblock(${user.userId})">차단 해제</button>
		            </div>`;
			});
			v_html += `</div>`;
		}
		$(".blocked-list").html(v_html);

	}).catch((error) => {
		console.error(error)
	});

}



// 차단
function block(userId) {
	const authHeader = AuthFunc.getAuthHeader;
	const apiRequest = AuthFunc.apiRequest;

	return apiRequest(() =>
		new Promise((resolve, reject) => {
			$.ajax({
				url: '/api/follow/block',
				headers: authHeader(),
				data: {
					'blockUser': userId
				},
				dataType: "json",
				success: function(json) {
					resolve(json);
				},
				error: function(xhr, textStatus, errorThrown) {


					// axios 스타일의 에러 객체로 변환
					const error = new Error(errorThrown || textStatus);
					error.response = {
						status: xhr.status,
						statusText: xhr.statusText,
						data: xhr.responseJSON || xhr.responseText
					};
					error.request = xhr;
					reject(error);
				}
			})

		})).then((json) => {
            location.href = ctxPath + "/mypage/userInfo";
		}).catch((error) => {});
}

// 차단취소
function unblock(userId) {
	const authHeader = AuthFunc.getAuthHeader;
	const apiRequest = AuthFunc.apiRequest;

	return apiRequest(() =>
		new Promise((resolve, reject) => {
			$.ajax({
				url: '/api/follow/unBlock',
				headers: authHeader(),
				data: {
					'blockUser': userId
				},
				dataType: "json",
				success: function(json) {
					resolve(json);
				},
				error: function(xhr, textStatus, errorThrown) {


					// axios 스타일의 에러 객체로 변환
					const error = new Error(errorThrown || textStatus);
					error.response = {
						status: xhr.status,
						statusText: xhr.statusText,
						data: xhr.responseJSON || xhr.responseText
					};
					error.request = xhr;
					reject(error);
				}
			})

		})).then((json) => {
			blockList();
		}).catch((error) => {}); // end of ajax ---
}


