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
    var player = "";
    var value_button = "";
    const nickName = $("#nickName_login").val();
    const socketRoom = io('http://localhost:2500/', {transports: ['websocket', 'polling', 'flashsocket']});
    const roomIndex = $(".room-title").attr('id');
    let data_join_room = {
        nickName,
        roomIndex
    }
    socketRoom.emit("user-join-room-req", data_join_room);
    socketRoom.on("user-join-room-res",function(data){
        if(data.status==1){
            if(data.player=="host"){
                player="host";
                value_button = "O";
            }else{
                player="player";
                value_button = "X";
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
        console.log(player);
    })
    socketRoom.on("change-position-res", function(data){
        player="host";
        value_button = "O";
        $(".info-player-two").children(".player-name").html("");
        $(".info-player-two").children(".total-played").html("");
        $(".info-player-two").children(".room-wined").html("");
        $(".info-player-one").children(".player-name").html(`Biệt danh: ${data.nickName}`);
        $(".info-player-one").children(".total-played").html(`Số trận đã chơi: ${data.winTotal+data.lostTotal}`);
        $(".info-player-one").children(".room-wined").html(data.roomWined);
    })
    socketRoom.on("data-player-rooms-res",function(data){
        console.log("nhân dc data", data);
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
    function updateBoard(r,c,value){
        $("#game-board").empty();
        for(i=0;i<ROW;i++){
            for(j=0;j<COL;j++){
                if(i==r && j==c){
                    if(value=="X")
                        $("#game-board").append(`
                            <button class='game-board-square player-x' r='${i}' c='${j}'>X</button>
                        `);
                    else
                        $("#game-board").append(`
                            <button class='game-board-square player-o' r='${i}' c='${j}'>O</button>
                        `);
                }
                else{
                    if(board[i][j]!="NULL"){
                        if(board[i][j]=="X")
                            $("#game-board").append(`
                                <button class='game-board-square player-x' r='${i}' c='${j}'>X</button>
                            `);
                        else
                            $("#game-board").append(`
                                <button class='game-board-square player-o' r='${i}' c='${j}'>O</button>
                            `);
                    }else $("#game-board").append(`
                                <button class='game-board-square' r='${i}' c='${j}'></button>
                            `);
                    
                }
            }
        }
    }
    drawBoardButton();

    $(".game-board-square").click(function(){
        let r = $(this).attr('r');
        let c = $(this).attr('c');
        board[r][c] = "X";
        updateBoard(r,c,"X");
    })
})
