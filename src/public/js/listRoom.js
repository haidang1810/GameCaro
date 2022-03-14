
$(window).on("load",function(){
    let token = getCookie("refreshToken");
    function checkLogin(){
        $.post("/refreshToken",{token},function(data){
            if(data!=null && data!=""){
                if(data.status==1){
                    setCookie("accessToken",data.accessToken,40)
                }else{
                    location.href = "/";
                }
            }
        })
        setTimeout(() => {
            checkLogin();
        }, 25000);
    }
    checkLogin();
    const nickName = $("#nickName_login").val();
    if(nickName)
        socket.emit("user-login-req",nickName);
    socket.on("user-login-res",function(data){
        $(".chat__boxed-message").append(`
            <div class="chat-item">
                <span class="chat-user">${data}: </span>
                <span class="chat-content"> Vừa online</span>
            </div>
        `)
    })
})