$(function() {


	getUserProfile();

    profileMusic.createProfileMusicList();
}); // end of $(function(){})

function getUserProfile() {
	const authHeader = AuthFunc.getAuthHeader;
	const apiRequest = AuthFunc.apiRequest;

	apiRequest(() =>
		new Promise((resolve, reject) => {
			$.ajax({
				url: '/api/userInfo/getInfo',
				headers: authHeader(),
				dataType: "json",
				success: function(json) {
					resolve(json);
				},
				error: function(xhr, textStatus, errorThrown) {
					const error = new Error(errorThrown || textStatus);
					error.response = {
						status: xhr.status,
						statusText: xhr.statusText,
						data: xhr.responseJSON || xhr.responseText
					};
					error.request = xhr;
					reject(error);
				}
			});
		})
	).then((json) => {
		const profile = $('div#profileLayer');

		let v_html = `
		<div class="inner" style="background-color: #F2F0FF;">
		    <div class="text-center" style="font-weight:bold; font-size: 16pt;">${json.myuser.username}</div>
		    <div class="text-center" style="font-size: 12pt; margin-top: 10px;">${json.myuser.nickname}</div>
			
			<div class="profile-img-wrap2"> 
			   <img src="${json.myuser.profile_image}" class="profile-img2" alt="" onclick="location.href='/mypage/myinfo'"> 
			</div> 	
		    <div class="flex stats">
		        <div>
		            <div class="font-bold number-color">${json.myuser.postCount}</div>
		            <div class="label-text">게시물</div>
		        </div>
		        <div>
		            <div class="font-bold number-color" style="cursor:pointer;"
		                 onclick="location.href='/mypage/myFollowers'">${json.myuser.followeeCount}</div>
		            <div class="label-text">팔로워</div>
		        </div>
		        <div>
		            <div class="font-bold number-color" style="cursor:pointer;"
		                 onclick="location.href='/mypage/myFollowers'">${json.myuser.followerCount}</div>
		            <div class="label-text">팔로우</div>
		        </div>
		    </div>
		</div>

      <div class="inner">
         <div class="font-bold" style="display:flex; justify-content: space-between;">
             <span>${json.myuser.nickname}님의 프로필 음악</span> 
<!--             <button style="margin-right: 3px;" id="myPlayList">+</button>-->
         </div>
         <div id="profileMusicList"></div>
      </div>
        `;

        profileMusic.createProfileMusicList();

        profile.html(v_html);

	}).catch((error) => {console.error(error) });
}

window.profileMusic = {
    createProfileMusicList : () => {
        return AuthFunc.apiRequest(() =>
            axios.get(`${ctxPath}/api/profileMusic/list`, {
                headers: AuthFunc.getAuthHeader()
            })
        )
            .then(response => {
                //console.log('aa');
                console.log(" profileMusic :: ", response.data);
                profileMusic.renderProfileMusicList(response.data);
            })
            .catch(error => {
                console.error('오류:', error);
                if (error.response) {
                    const errorData = error.response.data.error;
                    if (errorData){
                        alert(errorData.customMessage);
                    }
                }
            });
    },
    renderProfileMusicList : (musicData) => {
        if(musicData.length < 1) {
            document.querySelector("#profileMusicList").innerHTML = `<div class="empty-profile">설정된 프로필 음악이 없습니다!</div>`;
            return;
        }
        let html = `<div class="playlist-section">
                            <ul class="playlist-list mt-3">`;
        musicData.forEach((item, index) => {
            html += `
                    <li class="playlist-item">
                        <img src="${item.albumImageUrl}" style="width: 40px; height: 40px; margin-right: 10px;"/>
                        <div class="song-title">
                            <strong>${item.musicName}</strong>
                            <div class="song-artist">
                                <div class="scrolling-wrapper scrolling">
                                    <span>${item.artistName}</span>
                                    <span>${item.artistName}</span>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn-delete-profile" onclick="profileMusic.deleteProfileMusic('${item.musicId}')">x</button>
                    </li>`;
        });

        html += `</ul></div>`;

        document.querySelector("#profileMusicList").innerHTML = html;
    },
    deleteProfileMusic : (musicId) => {
        return AuthFunc.apiRequest(() =>
            axios.delete(`${ctxPath}/api/profileMusic/delete?musicId=${musicId}`, {
                headers: AuthFunc.getAuthHeader()
            })
        )
        .then(response => {
            alert(response.data);
            profileMusic.createProfileMusicList();
        })
        .catch(error => {
            console.error('오류:', error);
            if (error.response) {
                const errorData = error.response.data.error;
                if (errorData){
                    alert(errorData.customMessage);
                }
            }
        });
    }
}
