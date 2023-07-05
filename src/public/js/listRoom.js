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
    const socket = io('http://52.65.109.88:2000/', {transports: ['websocket', 'polling', 'flashsocket']});
    const socketRoom = io('http://52.65.109.88:3333/', {transports: ['websocket', 'polling', 'flashsocket']});
    
    const nickName = $("#nickName_login").val();
    if(nickName)
        socket.emit("user-login-req",nickName);
    socket.on("user-login-res",function(data){
        $(".chat__boxed-message").append(`
            <div class="chat-item">
                <span class="chat-user">${data}: </span>
                <span class="chat-content"> Vừa gia nhập phòng chờ</span>
            </div>
        `);
        $(".chat__boxed-message").scrollTop( $(".chat__boxed-message").scrollTop()+100 );
    })
    $(".form-send-message").submit(function(e){
        let message = $(".input-message").val();
        e.preventDefault();
        let data = {
            nickName,
            message
        }
        socket.emit("user-send-message",data);
        $(".input-message").val("");
    })
    socket.on("server-send-message",function(data){
        $(".chat__boxed-message").append(`
            <div class="chat-item">
                <span class="chat-user">${data.nickName}: </span>
                <span class="chat-content"> ${data.message}</span>
            </div>
        `)
        $(".chat__boxed-message").scrollTop( $(".chat__boxed-message").scrollTop()+100 );
    })
    socketRoom.emit("listRoom-req","");
    socketRoom.on("listRoom-res",function(data){
        $(".room").empty();
        data.forEach((value,index) => {
            let isPassword = "";
            if(value.password)
                isPassword = `<div class="room__item-status"><i class="fa fa-lock"></i></div>
                `;
            else{
                isPassword = `<div class="room__item-status hide"><i class="fa fa-lock"></i></div>
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
                if(value.password)
                    html += `<a class="btn room__item-btn" ' 
                    roomIndex='${index}' data-toggle="modal" href='' data-target="#joinRoomModal">Vào</a>`;
                else
                html += `<a class="btn room__item-btn" data-toggle="" data-target="" href='/room/?id=${index+1}' 
                    roomIndex='${index}' >Vào</a>`;
            }
            html += "</div>";
            $(".room").append(html);
        })
        $(".room__item-btn").click(function(){
            index = $(this).attr("roomIndex");
        })
    })
    socketRoom.on("update-room-res",function(data){
        var roomItem = `.room__item-${data.roomIndex}`;
        if(data.room.password){
            $(roomItem).children(".room__item-status").removeClass("hide");
            $(roomItem).children(".room__item-btn").attr('href','');
            $(roomItem).children(".room__item-btn").attr('data-toggle','modal');
            $(roomItem).children(".room__item-btn").attr('data-target','#joinRoomModal');
        }else{
            $(roomItem).children(".room__item-status").addClass("hide");
            $(roomItem).children(".room__item-btn").attr('href',`/room/?id=${data.roomIndex+1}`);
            $(roomItem).children(".room__item-btn").attr('data-target','');
            $(roomItem).children(".room__item-btn").attr('data-toggle','');
        }
        $(roomItem).children("#player-name-host").attr('title',data.room.host[1]);
        $(roomItem).children("#player-name-host").html(data.room.host[1]);
        
        $(roomItem).children("#player-name-player").attr('title',data.room.player[1]);
        $(roomItem).children("#player-name-player").html(data.room.player[1]);

        if(data.room.player[1]){
            $(roomItem).children(".room__item-btn").addClass("hide");
        }else
            $(roomItem).children(".room__item-btn").removeClass("hide");

        $(".room__item-btn").click(function(){
            index = $(this).attr("roomIndex");
        })
    })
    $("#submit-create-rooms").click(function(){
        let pass = $("#input-pass-create").val();
        socketRoom.emit("create-room-req", pass);
    })
    socketRoom.on("create-room-res",function(data){
        location.href = `/room/?id=${data+1}`;
    })
    var index = 0;
    
    $("#submit-join-rooms").click(function(){
        let data = {
            roomIndex: index,
            password: $("#input-pass-join").val()
        }
        socketRoom.emit("pass-join-room-req", data);
    })
    socketRoom.on("pass-join-room-res",function(data){
        if(data.status==1){
            location.href = `/room/?id=${data.roomIndex+1}`;
        }else{
            Toast.fire({
                icon: 'error',
                title: data.msg,
                background: 'rgba(220, 52, 73, 0.9)',
                color: '#ffffff',
                timer: 2500
            })
        }
    })
})
