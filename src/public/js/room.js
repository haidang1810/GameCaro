// const canvas = document.getElementById("game-board");
// const ctx = canvas.getContext('2d');


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
    const socketRoom = io('http://localhost:2500/', {transports: ['websocket', 'polling', 'flashsocket']});
    const roomIndex = $(".room-title").attr('roomIndex');
    let data_join_room = {
        nickName,
        roomIndex
    }
    socketRoom.emit("user-join-room-req", data_join_room);
    socketRoom.on("user-join-room-res",function(data){
        if(data.status==1){
            if(data.player=="player"){
                $(".room__game-header i").addClass("hide");
            }
        }else if(data.status==2){
            Toast.fire({
                icon: 'error',
                title: data.msg,
                background: 'rgba(220, 52, 73, 0.9)',
                color: '#ffffff',
                timer: 1000,
                didClose: ()=>{
                    location.href = "/home";
                }
            })
            
        }else{
            location.href = "/";
        }
    })
    socketRoom.on("change-position-res", function(data){
        $(".info-player-two").children(".player-name").html("");
        $(".info-player-two").children(".total-played").html("");
        $(".info-player-two").children(".room-wined").html("");
        $(".info-player-one").children(".player-name").html(`Biệt danh: ${data.nickName}`);
        $(".info-player-one").children(".total-played").html(`Số trận đã chơi: ${data.winTotal+data.lostTotal}`);
        $(".info-player-one").children(".room-wined").html(data.roomWined);
        $(".room__game-header i").removeClass("hide");
    })
    socketRoom.on("data-player-rooms-res",function(data){
        $(".info-player-two").children(".player-name").html(`Biệt danh: ${data.player.nickName}`);
        $(".info-player-two").children(".total-played").html(`Số trận đã chơi: ${data.player.winTotal+data.player.lostTotal}`);
        $(".info-player-two").children(".room-wined").html(data.player.roomWined);
        $(".info-player-one").children(".player-name").html(`Biệt danh: ${data.host.nickName}`);
        $(".info-player-one").children(".total-played").html(`Số trận đã chơi: ${data.host.winTotal+data.host.lostTotal}`);
        $(".info-player-one").children(".room-wined").html(data.host.roomWined);
    })
    socketRoom.on("player-out",function(){
        $(".info-player-two").children(".player-name").html("");
        $(".info-player-two").children(".total-played").html("");
        $(".info-player-two").children(".room-wined").html("");
    })
    const ROW = 15;
    const COL = 15;

    let board = [];
    for(i=0;i<ROW;i++){
        board[i] = []
        for(j=0;j<COL;j++){
            board[i][j] = "NULL";
        }
    }

    function drawBoardButton(){
        for(i=0;i<ROW;i++){
            for(j=0;j<COL;j++){
                $("#game-board").append(`
                    <button class='game-board-square' r='${i}' c='${j}'></button>
                `)
            }
        }
    }

    drawBoardButton();

    $(".game-board-square").click(function(){
        let r = $(this).attr('r');
        let c = $(this).attr('c');
        let data = {
            r,
            c,
            roomIndex
        }
        socketRoom.emit("user-click-req",data);
    })

    $("#submit-setting-rooms").click(function(){
        let password = $("#input-pass-setting").val();
        let roomIndex = Number($(".room-title").attr("roomIndex") - 1 );
        let playerFirst = $("#playerFirst").val();
        let char =  $('input[name="char"]:checked').val();
        let data = {
            password,
            roomIndex,
            playerFirst,
            char
        }
        socketRoom.emit("change-setting-room-req", data);
    })
    socketRoom.on("change-setting-room-res",function(data){
        if(data.status==1){
            Toast.fire({
                icon: 'success',
                title: 'Lưu cài đặt thành công!',
                background: 'rgba(35, 147, 67, 0.9)',
                color: '#ffffff',
                timer: 1500
            })
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
    function updateBoard(data){
        $("#game-board").empty();
        for(i=0;i<ROW;i++){
            for(j=0;j<COL;j++){
                if(data[i][j]!="NULL"){
                    if(data[i][j]=="X")
                        $("#game-board").append(`
                            <button class='game-board-square player-x' r='${i}' c='${j}'>${data[i][j]}</button>
                        `);
                    else
                    $("#game-board").append(`
                            <button class='game-board-square player-o' r='${i}' c='${j}'>${data[i][j]}</button>
                        `);
                }
                else{
                    $("#game-board").append(`
                    <button class='game-board-square' r='${i}' c='${j}'></button>
                `)
                }
            }
        }
    }
    socketRoom.on("user-click-res",function(data){
        if(data.status==1){
            updateBoard(data.board);
        }else{
            Toast.fire({
                icon: 'error',
                title: data.msg,
                background: 'rgba(220, 52, 73, 0.9)',
                color: '#ffffff',
                timer: 1000,
            })
        }
        $(".game-board-square").click(function(){
            let r = $(this).attr('r');
            let c = $(this).attr('c');
            let data = {
                r,
                c,
                roomIndex
            }
            socketRoom.emit("user-click-req",data);
        })
    })

    $(".btn-ready").click(function(){
        socketRoom.emit("player-ready-req",roomIndex);
    })
    socketRoom.on("player-ready-res",function(data){
        if(data){
            $(".btn-ready").html("Bỏ sẵn sàng");
        }else $(".btn-ready").html("Sẵn sàng");
    })
})
