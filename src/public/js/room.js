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

    const nickName = $("#nickName_login").val();
    var player = "";
    const socketRoom = io('http://localhost:2500/', {transports: ['websocket', 'polling', 'flashsocket']});
    const roomIndex = $(".room-title").attr('roomIndex');
    let data_join_room = {
        nickName,
        roomIndex
    }
    socketRoom.emit("user-join-room-req", data_join_room);
    socketRoom.on("user-join-room-res",function(data){
        if(data.status==1){
            player = data.player;
            if(data.player=="player"){
                $(".room__game-header i").addClass("hide");
                $(".btn-ready").removeAttr("disabled");
                $(".btn-start-game").prop('disabled', true);
            }else{
                $(".btn-ready").prop('disabled', true);
                $(".btn-start-game").removeAttr("disabled");
            }
            if(data.isPassword) $(".info__setting-pass").html("có");
            else $(".info__setting-pass").html("không");

            if(data.playerFirst=='host') $(".info__setting-first").html("chủ phòng");
            else $(".info__setting-first").html("người chơi");

            $(".info__setting-time").html(`${data.timePerTurn}s`);
            time = data.timePerTurn;
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
        $(".info-player-two").children(".player-name").html("Biệt danh:");
        $(".info-player-two").children(".total-played").html("Số trận đã chơi:");
        $(".info-player-two").children(".room-wined").html("0");
        $(".info-player-one").children(".player-name").html(`Biệt danh: ${data.nickName}`);
        $(".info-player-one").children(".total-played").html(`Số trận đã chơi: ${data.winTotal+data.loseTotal}`);
        $(".info-player-one").children(".room-wined").html(data.roomWined);
        $(".room__game-header i").removeClass("hide");
        $(".btn-ready").prop('disabled', true);
        $(".btn-start-game").removeAttr("disabled");
        $(".btn-ready").html("Sẵn sàng");
        $(".circular-progress-player").css("background", `conic-gradient(
            #4d5bf9 360deg,
            #cadcff 360deg
        )`)
        $(".circular-progress-host").css("background", `conic-gradient(
            #4d5bf9 360deg,
            #cadcff 360deg
        )`)
    })
    socketRoom.on("data-player-rooms-res",function(data){
        $(".info-player-two").children(".player-name").html(`Biệt danh: ${data.player.nickName}`);
        $(".info-player-two").children(".total-played").html(`Số trận đã chơi: ${data.player.winTotal+data.player.loseTotal}`);
        $(".info-player-two").children(".room-wined").html(data.player.roomWined);
        $(".info-player-one").children(".player-name").html(`Biệt danh: ${data.host.nickName}`);
        $(".info-player-one").children(".total-played").html(`Số trận đã chơi: ${data.host.winTotal+data.host.loseTotal}`);
        $(".info-player-one").children(".room-wined").html(data.host.roomWined);
    })
    socketRoom.on("player-out",function(){
        $(".info-player-two").children(".player-name").html("Biệt danh:");
        $(".info-player-two").children(".total-played").html("Số trận đã chơi:");
        $(".info-player-two").children(".room-wined").html("0");
        $(".btn-ready").html("Sẵn sàng");
        $(".circular-progress-player").css("background", `conic-gradient(
            #4d5bf9 360deg,
            #cadcff 360deg
        )`)
        $(".circular-progress-host").css("background", `conic-gradient(
            #4d5bf9 360deg,
            #cadcff 360deg
        )`)
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
        $("#game-board").empty();
        for(i=0;i<ROW;i++){
            for(j=0;j<COL;j++){
                $("#game-board").append(`
                    <button class='game-board-square' r='${i}' c='${j}'></button>
                `)
            }
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
    }

    drawBoardButton();

    

    $("#submit-setting-rooms").click(function(){
        let password = $("#input-pass-setting").val();
        let timePerTurn = $("#timePerTurn").val();
        let roomIndex = Number($(".room-title").attr("roomIndex") - 1 );
        let playerFirst = $("#playerFirst").val();
        let char =  $('input[name="char"]:checked').val();
        let data = {
            password,
            roomIndex,
            playerFirst,
            char,
            timePerTurn
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
            if(data.isPassword) $(".info__setting-pass").html("có");
            else $(".info__setting-pass").html("không");

            if(data.playerFirst=='host') $(".info__setting-first").html("chủ phòng");
            else $(".info__setting-first").html("người chơi");

            $(".info__setting-time").html(`${data.timePerTurn}s`);
            time = data.timePerTurn;
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
    let isStopHost = true;
    let isStopPlayer = true;
    socketRoom.on("user-click-res",function(data){
        if(data.status==1){
            updateBoard(data.board);
            if(data.turn=="host"){
                isStopHost = false;
                isStopPlayer = true;
                timeHostStart(time);
            }else{
                isStopHost = true;
                isStopPlayer = false;
                timePlayerStart(time);
            }
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
    $(".btn-start-game").click(function(){
        socketRoom.emit("host-start-game-req",roomIndex);
    })
    var time = 60;
    socketRoom.on("host-start-game-res",function(data){
        drawBoardButton();
        if(data.status==1){
            $(".btn-start-game").prop('disabled', true);
            if(data.turn=="host"){
                isStopHost = false;
                isStopPlayer = true;
                timeHostStart(time);
            }else{
                isStopHost = true;
                isStopPlayer = false;
                timePlayerStart(time);
            }
        }else{
            Toast.fire({
                icon: 'error',
                title: data.msg,
                background: 'rgba(220, 52, 73, 0.9)',
                color: '#ffffff',
                timer: 1000
            })
        }
    })

    

    function timeHostStart(time){
        let progressBar = document.querySelector(".circular-progress-host");       
        let progressEndValue = 100;
        let progressValue = 0;
        const speed = time*1000/progressEndValue;
        let progress = setInterval(() => {
        progressValue++;
        
        progressBar.style.background = `conic-gradient(
            #4d5bf9 ${progressValue * 3.6}deg,
            #cadcff ${progressValue * 3.6}deg
        )`;
        if (progressValue == progressEndValue) {
            clearInterval(progress);
            if(player=='host')
                socketRoom.emit("host-time-up-req",roomIndex);
        }
        if(isStopHost){
            clearInterval(progress);
            $(".circular-progress-player").css("background", `conic-gradient(
                #4d5bf9 360deg,
                #cadcff 360deg
            )`)
            $(".circular-progress-host").css("background", `conic-gradient(
                #4d5bf9 360deg,
                #cadcff 360deg
            )`)
            return;
        }
        }, speed);
    }
    function timePlayerStart(time){
        let progressBar = document.querySelector(".circular-progress-player");        
        let progressEndValue = 100;
        let progressValue = 0;
        const speed = time*1000/progressEndValue;
        let progress = setInterval(() => {
        progressValue++;
        
        progressBar.style.background = `conic-gradient(
            #4d5bf9 ${progressValue * 3.6}deg,
            #cadcff ${progressValue * 3.6}deg
        )`;
        if (progressValue == progressEndValue) {
            clearInterval(progress);
            if(player=='player')
                socketRoom.emit("player-time-up-req",roomIndex);
        }
        if(isStopPlayer){
            clearInterval(progress);
            $(".circular-progress-player").css("background", `conic-gradient(
                #4d5bf9 360deg,
                #cadcff 360deg
            )`)
            $(".circular-progress-host").css("background", `conic-gradient(
                #4d5bf9 360deg,
                #cadcff 360deg
            )`)
            return;
        }
        }, speed);
    }

    socketRoom.on("end-game-res",function(data){
        isStopPlayer = true;
        isStopHost = true;
        $(".info-player-one").children(".room-wined").html(data.host);
        $(".info-player-two").children(".room-wined").html(data.player);
        if(player=='host'){
            $(".btn-start-game").removeAttr("disabled");
        }
        if(data.win==player){
            Swal.fire({
                iconHtml: '<img src="/images/winner.png" style="width:100px; height:100px">',
                title: "Rất tuyệt vời !!!",
            });
        }else{
            Swal.fire({
                iconHtml: '<img src="/images/loser.png" style="width:100px; height:100px">',
                title: "Chúc bạn may mắn lần sau !!!",
            });
        }
        if(data.playerFirst=='host') $(".info__setting-first").html("chủ phòng");
        else $(".info__setting-first").html("người chơi");
        $(".circular-progress-player").css("background", `conic-gradient(
            #4d5bf9 360deg,
            #cadcff 360deg
        )`)
        $(".circular-progress-host").css("background", `conic-gradient(
            #4d5bf9 360deg,
            #cadcff 360deg
        )`)
    })
    $(".toggleChat").click(function(){
        $(".chat-room").toggleClass("hide-chat");
    })
    $(".form-send-message-room").submit(function(e){
        e.preventDefault();
        let massage = $("#input-chat-room-msg").val();
        $("#input-chat-room-msg").val("");
        socketRoom.emit("send-msg-room-req",{roomIndex,massage,nickName});
    })
    socketRoom.on("send-msg-room-res",function(data){
        $(".chat__room-message").append(`
            <div class="chat-item">
                <span class="chat-user">${data.nickName}: </span>
                <span class="chat-content"> ${data.message}</span>
            </div>
        `)
        $.playSound('/sounds/sound.mp3');
    })
})
