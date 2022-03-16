$(window).on("load",function(){
    const events = [
        "pagehide", "pageshow",
        "unload", "load"
    ];
    const eventLogger = event => {
        switch (event.type) {
            case "pagehide":
            case "pageshow":
                let isPersisted = event.persisted ? "persisted" : "not persisted";
                console.log('Event:', event.type, '-', isPersisted);
                break;
            default:
                console.log('Event:', event.type);
                break;
        }
    };
    events.forEach(eventName =>
        window.addEventListener(eventName, eventLogger)
    );
    const socket = io('http://localhost:2000/', {transports: ['websocket', 'polling', 'flashsocket']});
    const socketRoom = io('http://localhost:2500/', {transports: ['websocket', 'polling', 'flashsocket']});


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
                <span class="chat-content"> Vừa gia nhập phòng chờ</span>
            </div>
        `)
    })
    $(".form-send-message").submit(function(e){
        let massage = $(".input-message").val();
        e.preventDefault();
        let data = {
            nickName,
            massage
        }
        console.log("send data");
        socket.emit("user-send-message",data);
        $(".input-message").val("");
    })
    socket.on("server-send-message",function(data){
        $(".chat__boxed-message").append(`
            <div class="chat-item">
                <span class="chat-user">${data.nickName}: </span>
                <span class="chat-content"> ${data.massage}</span>
            </div>
        `)
    })
    socketRoom.emit("listRoom-req","");
    socketRoom.on("listRoom-res",function(data){
        data.forEach((value,index) => {
            let isPassword = "";
            if(value.password)
                isPassword = `<div class="room__item-status"><i class="fa fa-lock"></i></div>
                    <input type='hidden' id='room-password' value='${value.password}'>
                `;
            else{
                isPassword = `<div class="room__item-status hide"><i class="fa fa-lock"></i></div>
                    <input type='hidden' id='room-password' value=''>
                `;
            }
            let html = `
            <div class="room__item room__item-${index}">
                    ${isPassword}
                    <div class="room__item-title">Số phòng: ${index+1}</div>
                    <span class="room__item-user">Người chơi:</span>
                    <p class="player player-one" id='player-name-host' data-toggle="tooltip" data-placement="top" title="${value.host[1]}">${value.host[1]}</p>
                    <p class="player player-two" id='player-name-player' data-toggle="tooltip" data-placement="top" title="${value.player[1]}">${value.player[1]}</p>
            `;
            

            if(!value.player[1]){
                html += `<a class="btn room__item-btn" href='/room/?id=${index+1}' id='${index}'>Vào</a>`;
            }
            html += "</div>";
            $(".room").append(html);
        })
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })
    })
    socketRoom.on("update-room-res",function(data){
        console.log("Nhận res update",data);
        var roomItem = `.room__item-${data.roomIndex}`;
        if(data.room.password){
            $(roomItem).children("#room-password").val(data.room.password);
            $(roomItem).children(".room__item-status").removeClass("hide");
        }else{
            $(roomItem).children("#room-password").val("");
            $(roomItem).children(".room__item-status").addClass("hide");
        }
        $(roomItem).children("#player-name-host").attr('title',data.room.host[1]);
        $(roomItem).children("#player-name-host").html(data.room.host[1]);
        
        $(roomItem).children("#player-name-player").attr('title',data.room.player[1]);
        $(roomItem).children("#player-name-player").html(data.room.player[1]);

        if(data.room.player[1]){
            $(roomItem).children(".room__item-btn").addClass("hide");
        }else
            $(roomItem).children(".room__item-btn").removeClass("hide");
    })
})
