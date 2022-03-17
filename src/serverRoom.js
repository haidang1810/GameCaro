'use strict';
const path = require('path');
const express = require('express');
const port = 2500;
const  db = require('./config/db')
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const cookieParser = require('cookie-parser');
const User = require('./app/db/User');
db.connect();
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());

let board = new Array();
for(let i=0;i<15;i++){
    board[i] = []
    for(let j=0;j<15;j++){
        board[i][j] = "NULL";
    }
}
var rooms = [
    {
        roomID: "",
        password: "",
        host: ["","",0],
        player: ["","",0,false],
        board: [...board],
        playerFirst: "host",
        char: "X",
        isStart: false,
        timePerTurn: 60
    },
    {
        roomID: "",
        password: "",
        host: ["","",0],
        player: ["","",0,false],
        board: [...board],
        playerFirst: "host",
        char: "X",
        isStart: false,
        timePerTurn: 60
    },
    {
        roomID: "",
        password: "",
        host: ["","",0],
        player: ["","",0,false],
        board: JSON.parse(JSON.stringify(board)),
        playerFirst: "host",
        char: "X",
        isStart: false,
        timePerTurn: 60
    },
]
let horizontal = (Mat, Cur_row, Cur_col, Value) => {
    let count_left = 0;
    let count_right = 0;
    //Di sang phia ben trai so voi vi tri hien tai
    for (let i = Cur_col; i >= 0; i--) {
        if (Mat[Cur_row][i] === Value) {
            count_left++;
        }
        else {
            break;
        }
    }
     //Di sang phia ben phai so voi vi tri hien tai
    for (let j = Cur_col + 1; j < 16; j++) {
        if (Mat[Cur_row][j] === Value) {
            count_right++;
        }
        else {
            break;
        }
    }
    if (count_right + count_left >= 5) {
        return true;
    }else return false;
}
let vertically = (Mat, Cur_row, Cur_col, Value) => {
    let count_top = 0;
    let count_bottom = 0;
    //Di sang phia ben trên so voi vi tri hien tai
    for (let i = Cur_row; i >= 0; i--) {
        if (Mat[i][Cur_col] === Value) {
            count_top++;
        }
        else {
            break;
        }
    }
     //Di sang phia ben duoi so voi vi tri hien tai
    for (let j = Cur_row + 1; j < 16; j++) {
        if (Mat[j][Cur_col] === Value) {
            count_bottom++;
        }
        else {
            break;
        }
    }
    if (count_top + count_bottom >= 5) {
        return true;
    }else return false;
}
let diagonalLeft = (Mat, Cur_row, Cur_col, Value) => {
    let count_top_left = 0;
    let count_right_bottom = 0;
    //Di sang phia ben trai tren so voi vi tri hien tai
    let col = Cur_col;
    for (let i = Cur_row; i >= 0; i--) {
        if (Mat[i][col] === Value) {
            count_top_left++;
        }
        else {
            break;
        }
        col--;
        if(col<0) break;
    }
     //Di sang phia ben phai so voi vi tri hien tai
    col = Cur_col;
    for (let j = Cur_row + 1; j < 16; j++) {
        if (Mat[j][col] === Value) {
            count_right_bottom++;
        }
        else {
            break;
        }
        col++
        if(col>15) break;
    }
    if (count_top_left + count_right_bottom >= 5) {
        return true;
    }else return false;
}
let diagonalRight = (Mat, Cur_row, Cur_col, Value) => {
    let count_top_right = 0;
    let count_left_bottom = 0;
    //Di sang phia ben trai tren so voi vi tri hien tai
    let col = Cur_col;
    for (let i = Cur_row; i >= 0; i--) {
        if (Mat[i][col] === Value) {
            count_top_right++;
        }
        else {
            break;
        }
        col++;
        if(col>15) break;
    }
     //Di sang phia ben phai so voi vi tri hien tai
    col = Cur_col;
    for (let j = Cur_row + 1; j < 15; j++) {
        if (Mat[j][col] === Value) {
            count_left_bottom++;
        }
        else {
            break;
        }
        col--
        if(col<0) break;
    }
    if (count_top_right + count_left_bottom >= 5) {
        return true;
    }else return false;
}
io.on('connection', socket => {
    socket.on("listRoom-req", function(){
        socket.emit("listRoom-res", rooms);
    })
    socket.on("user-join-room-req", function(data){
        var roomIndex = data.roomIndex - 1;
        if(roomIndex > rooms.length-1){
            let data = {
                status:  2,
                player: "",
                msg: "Phòng không tồn tại"
            }
            socket.emit("user-join-room-res", data);
            return;
        }
        var nickName = data.nickName;
        let isPassword = false;
        if(rooms[roomIndex].password!="") isPassword = true;
        if(rooms[roomIndex].host[1]==""){
            let data = {
                status:  1,
                player: "host",
                isPassword,
                playerFirst: rooms[roomIndex].playerFirst,
                timePerTurn: rooms[roomIndex].timePerTurn,
                msg: "success!",
            }
            socket.emit("user-join-room-res", data);
            rooms[roomIndex].roomID = socket.id;
            rooms[roomIndex].host[0] = socket.id;
            rooms[roomIndex].host[1] = nickName;

            let data_res_update_room = {
                roomIndex,
                room: rooms[roomIndex]
            };
            io.sockets.emit("update-room-res",data_res_update_room);
        }else{
            if(rooms[roomIndex].player[1]==""){
                let data = {
                    status:  1,
                    player: "player",
                    isPassword,
                    playerFirst: rooms[roomIndex].playerFirst,
                    timePerTurn: rooms[roomIndex].timePerTurn,
                    msg: "success!",
                }
                socket.emit("user-join-room-res", data);
                socket.join(rooms[roomIndex].roomID);
                rooms[roomIndex].player[0] = socket.id;
                rooms[roomIndex].player[1] = nickName;
                let data_res_update_room = {
                    roomIndex,
                    room: rooms[roomIndex]
                };
                io.sockets.emit("update-room-res",data_res_update_room);
            }else{
                let data = {
                    status:  2,
                    player: "",
                    msg: "Phòng đầy."
                }
                socket.emit("user-join-room-res", data);
            }
        }
        let data_player_rooms = {
            host: {
                nickName: "",
                winTotal: 0,
                loseTotal: 0,
                roomWined: rooms[roomIndex].host[2]
            },
            player: {
                nickName: "",
                winTotal: 0,
                loseTotal: 0,
                roomWined: rooms[roomIndex].player[2]
            }
        };
        User.findOne({
            nickName: rooms[roomIndex].host[1]
        }).then((data) => {
            if(data){
                data_player_rooms.host.nickName = data.nickName;
                data_player_rooms.host.winTotal = data.winTotal;
                data_player_rooms.host.loseTotal = data.loseTotal;
            }
        }).then(()=>{
            User.findOne({
                nickName: rooms[roomIndex].player[1]
            }).then((data) => {
                if(data){
                    data_player_rooms.player.nickName = data.nickName;
                    data_player_rooms.player.winTotal = data.winTotal;
                    data_player_rooms.player.loseTotal = data.loseTotal;
                }
                io.sockets.in(rooms[roomIndex].roomID).emit("data-player-rooms-res",data_player_rooms);
            }).catch(() => {
                let err = {
                    status:  3,
                    player: "",
                    msg: "Lỗi server"
                }
                return socket.emit("user-join-room-res", err);
            })
        }).catch(() => {
            let err = {
                status:  3,
                player: "",
                msg: "Lỗi server"
            }
            return socket.emit("user-join-room-res", err);
        })
        
    })
    socket.on("create-room-req",function(data){
        let room = new Object({
            roomID: socket.id,
            password: data,
            host: ["","",0], //0 là số trận thắng trong rooms
            player: ["","",0],
            board: JSON.parse(JSON.stringify(board)),
            playerFirst: "host",
            char: "X"
        });
        rooms.push(room);
        let roomIndex = rooms.findIndex(r => r.roomID == socket.id);
        socket.emit("create-room-res",roomIndex);
        io.sockets.emit("listRoom-res", rooms);
    })
    socket.on("pass-join-room-req", function(data){
        if(data.roomIndex > rooms.length-1) return;
        if(rooms[data.roomIndex].password===data.password){
            let res = {
                status: 1,
                roomIndex: Number(data.roomIndex),
                msg: "success!"
            }
            socket.emit("pass-join-room-res", res);
        }else{
            let res = {
                status: 2,
                roomIndex: "",
                msg: "Sai mật khẩu"
            }
            socket.emit("pass-join-room-res", res);
        }
    })
    socket.on("change-setting-room-req", function(data){
        let roomIndex = data.roomIndex;
        let password = data.password;
        let playerFirst = data.playerFirst;
        let timePerTurn = data.timePerTurn;
        let char = data.char;
        if( roomIndex > rooms.length-1) return;
        if(rooms[roomIndex].host[0]!=socket.id) return;
        if(rooms[roomIndex].isStart)
        socket.emit("change-setting-room-res", {status:1, msg:"Vui lòng đợi ván đấu kết thúc!"})
        rooms[roomIndex].password = password;
        rooms[roomIndex].playerFirst = playerFirst;
        rooms[roomIndex].char = char;
        rooms[roomIndex].timePerTurn = timePerTurn;
        let data_res_update_room = {
            roomIndex,
            room: rooms[roomIndex]
        };
        io.sockets.emit("update-room-res",data_res_update_room);
        let isPassword = false;
        if(rooms[roomIndex].password!="") isPassword = true;
        let data_change_position_res = {
            status:1,
            timePerTurn: rooms[roomIndex].timePerTurn,
            playerFirst: rooms[roomIndex].playerFirst,
            isPassword
        }
        io.sockets.in(rooms[roomIndex].roomID).emit("change-setting-room-res", data_change_position_res)
    })
    socket.on("player-ready-req",function(roomIndex){
        roomIndex--;
        if(roomIndex > rooms.length-1) return;
        if(socket.id!=rooms[roomIndex].player[0]) return;
        rooms[roomIndex].player[3] = !rooms[roomIndex].player[3];
        io.sockets.in(rooms[roomIndex].roomID).emit("player-ready-res",rooms[roomIndex].player[3]);
    })
    socket.on("host-start-game-req",function(data){
        let roomIndex = data - 1;
        if(roomIndex > rooms.length-1) return;
        if(socket.id!=rooms[roomIndex].host[0]) return;
        if(rooms[roomIndex].player[3]==true){
            rooms[roomIndex].isStart = true;
            rooms[roomIndex].board = JSON.parse(JSON.stringify(board));
            let data_res = {
                status: 1,
                msg: "success!",
                turn: rooms[roomIndex].playerFirst
            }
            io.sockets.in(rooms[roomIndex].roomID).emit("host-start-game-res",data_res)
        }else{
            let data_res = {
                status: 2,
                msg: "Người chơi chưa sẵn sàng!"
            }
            socket.emit("host-start-game-res",data_res);
        }
    })
    socket.on("user-click-req",function(data){
        let roomIndex = data.roomIndex - 1;
        let r = Number(data.r);
        let c = Number(data.c);
        let playerChar = "";
        let playerClick = rooms[roomIndex].playerFirst;
        if(roomIndex > rooms.length-1) return;
        if(!rooms[roomIndex].isStart) return;
        if(socket.id == rooms[roomIndex].player[0]){
            if(rooms[roomIndex].playerFirst=='player'){
                if(rooms[roomIndex].board[r][c] == "NULL"){
                    if(rooms[roomIndex].char=='X'){
                        rooms[roomIndex].board[r][c] = 'O';
                        playerChar = "O";
                    }
                    else {
                        rooms[roomIndex].board[r][c] = 'X';
                        playerChar = "X";
                    }
                    rooms[roomIndex].playerFirst = 'host';
                    let user_click_req = {
                        status: 1,
                        turn: rooms[roomIndex].playerFirst,
                        board: rooms[roomIndex].board
                    };
                    io.sockets.in(rooms[roomIndex].roomID).emit("user-click-res",user_click_req);
                }
            }else{
                let user_click_req = {
                    status: 2,
                    msg: "Chưa tới lượt"
                };
                socket.emit("user-click-res",user_click_req);
            }
            console.log("board sau khi click",board);
        }else if(socket.id == rooms[roomIndex].host[0]){
            if(rooms[roomIndex].playerFirst=='host'){
                if(rooms[roomIndex].board[r][c] == "NULL"){
                    if(rooms[roomIndex].char=='X'){
                        rooms[roomIndex].board[r][c] = 'X';
                        playerChar = "X";                        
                    }
                    else {
                        rooms[roomIndex].board[r][c] = 'O';
                        playerChar = "O";  
                    }
                    rooms[roomIndex].playerFirst = 'player';
                    let user_click_req = {
                        status: 1,
                        turn: rooms[roomIndex].playerFirst,
                        board: rooms[roomIndex].board
                    };
                    io.sockets.in(rooms[roomIndex].roomID).emit("user-click-res",user_click_req);
                }
            }else{
                let user_click_req = {
                    status: 2,
                    msg: "Chưa tới lượt của bạn!"
                };
                socket.emit("user-click-res",user_click_req);
            }
            console.log("board sau khi click",board);
        }
        if(horizontal(rooms[roomIndex].board,r,c,playerChar)
        || vertically(rooms[roomIndex].board,r,c,playerChar)
        || diagonalLeft(rooms[roomIndex].board,r,c,playerChar)
        || diagonalRight(rooms[roomIndex].board,r,c,playerChar)){
            if(playerClick=='player') {
                rooms[roomIndex].player[2]++;
                User.updateOne({nickName:rooms[roomIndex].player[1]},
                    {
                        $inc : {'winTotal' : 1}
                    }).then(()=>{
                        console.log("update total win success");
                    }).catch((err)=>{console.log(`update total win error ${err}`);})
                User.updateOne({nickName:rooms[roomIndex].host[1]},
                    {
                        $inc : {'loseTotal' : 1}
                    }).then(()=>{
                        console.log("update total lose success");
                    }).catch((err)=>{console.log(`update total lose error ${err}`);})
            }
            else {
                rooms[roomIndex].host[2]++;
                User.updateOne({nickName:rooms[roomIndex].host[1]},
                    {
                        $inc : {'winTotal' : 1}
                    }).then(()=>{
                        console.log("update total win success");
                    }).catch((err)=>{console.log(`update total win error ${err}`);})
                User.updateOne({nickName:rooms[roomIndex].player[1]},
                    {
                        $inc : {'loseTotal' : 1}
                    }).then(()=>{
                        console.log("update total lose success");
                    }).catch((err)=>{console.log(`update total lose error ${err}`);})
            }
            rooms[roomIndex].isStart = false;
            rooms[roomIndex].board = JSON.parse(JSON.stringify(board));
            let dataWin = {
                player: rooms[roomIndex].player[2],
                host: rooms[roomIndex].host[2],
                win: playerClick,
                playerFirst: rooms[roomIndex].playerFirst
            }
            io.sockets.in(rooms[roomIndex].roomID).emit("end-game-res",dataWin);
        }
    })
    socket.on("player-time-up-req",function(roomIndex){
        roomIndex--;
        if(roomIndex > rooms.length - 1) return;
        rooms[roomIndex].host[2]++;
        rooms[roomIndex].playerFirst = "player";
        rooms[roomIndex].isStart = false;
        rooms[roomIndex].board = JSON.parse(JSON.stringify(board));
        let data = {
            player: rooms[roomIndex].player[2],
            host: rooms[roomIndex].host[2],
            win: "host",
            playerFirst: rooms[roomIndex].playerFirst
        }
        io.sockets.in(rooms[roomIndex].roomID).emit("end-game-res",data);
        User.updateOne({nickName:rooms[roomIndex].host[1]},
            {
                $inc : {'winTotal' : 1}
            }).then(()=>{
                console.log("update total win success");
            }).catch((err)=>{console.log(`update total win error ${err}`);})
        User.updateOne({nickName:rooms[roomIndex].player[1]},
            {
                $inc : {'loseTotal' : 1}
            }).then(()=>{
                console.log("update total lose success");
            }).catch((err)=>{console.log(`update total lose error ${err}`);})
    })
    socket.on("host-time-up-req",function(roomIndex){
        roomIndex--;
        if(roomIndex > rooms.length - 1) return;
        rooms[roomIndex].player[2]++;
        rooms[roomIndex].playerFirst = "host";
        rooms[roomIndex].isStart = false;
        rooms[roomIndex].board = JSON.parse(JSON.stringify(board));
        let data = {
            player: rooms[roomIndex].player[2],
            host: rooms[roomIndex].host[2],
            win: "player",
            playerFirst: rooms[roomIndex].playerFirst
        }
        io.sockets.in(rooms[roomIndex].roomID).emit("end-game-res",data);
        User.updateOne({nickName:rooms[roomIndex].player[1]},
            {
                $inc : {'winTotal' : 1}
            }).then(()=>{
                console.log("update total win success");
            }).catch((err)=>{console.log(`update total win error ${err}`);})
        User.updateOne({nickName:rooms[roomIndex].host[1]},
            {
                $inc : {'loseTotal' : 1}
            }).then(()=>{
                console.log("update total lose success");
            }).catch((err)=>{console.log(`update total lose error ${err}`);})
    })
    socket.on("disconnect", function(){
        rooms.forEach((value,index) => {
            if(value.player[0]==socket.id){
                if(rooms[index].isStart){
                    User.updateOne({nickName:rooms[index].host[1]},
                        {
                            $inc : {'winTotal' : 1}
                        }).then(()=>{
                            console.log("update total win success");
                        }).catch((err)=>{console.log(`update total win error ${err}`);})
                    User.updateOne({nickName:rooms[index].player[1]},
                        {
                            $inc : {'loseTotal' : 1}
                        }).then(()=>{
                            console.log("update total lose success");
                        }).catch((err)=>{console.log(`update total lose error ${err}`);})
                }
                rooms[index].player[0] = "";
                rooms[index].player[1] = "";
                rooms[index].player[2] = 0;
                rooms[index].player[3] = false;
                rooms[index].host[2]++;
                rooms[index].board = JSON.parse(JSON.stringify(board));
                let data_res_update_room = {
                    roomIndex: index,
                    room: rooms[index]
                };
                io.sockets.in(value.roomID).emit("player-out","");
                io.sockets.emit("update-room-res",data_res_update_room);
                if(rooms[index].isStart){
                    let dataWin = {
                        player: rooms[index].player[2],
                        host: rooms[index].host[2],
                        win: 'host',
                        playerFirst: 'host'
                    }
                    io.sockets.in(rooms[index].host[0]).emit("end-game-res",dataWin);
                }
                rooms[index].isStart = false;
                return;
            }
            if(value.host[0]==socket.id){
                if(rooms[index].isStart){
                    User.updateOne({nickName:rooms[index].player[1]},
                        {
                            $inc : {'winTotal' : 1}
                        }).then(()=>{
                            console.log("update total win success");
                        }).catch((err)=>{console.log(`update total win error ${err}`);})
                    User.updateOne({nickName:rooms[index].host[1]},
                        {
                            $inc : {'loseTotal' : 1}
                        }).then(()=>{
                            console.log("update total lose success");
                        }).catch((err)=>{console.log(`update total lose error ${err}`);})
                }
                User.findOne({
                    nickName: value.host[1]
                }).then((dataDB)=>{
                    if(dataDB){
                        let data_change_position = {
                            nickName: dataDB.nickName,
                            winTotal: dataDB.winTotal,
                            loseTotal: dataDB.loseTotal,
                            roomWined:  rooms[index].player[2]
                        }
                        io.sockets.in(value.roomID).emit("change-position-res",data_change_position);
                        rooms[index].roomID = rooms[index].player[0];
                        rooms[index].host[0] = rooms[index].player[0];
                        rooms[index].host[1] = rooms[index].player[1];
                        rooms[index].host[2] = rooms[index].player[2];
                        rooms[index].host[2]++;
                        rooms[index].board = JSON.parse(JSON.stringify(board));
                        rooms[index].player[0] = "";
                        rooms[index].player[1] = "";
                        rooms[index].player[2] = 0;
                        rooms[index].player[3] = false;
                        let data_res_update_room = {
                            roomIndex: index,
                            room: rooms[index]
                        };
                        io.sockets.emit("update-room-res",data_res_update_room);
                        if(rooms[index].isStart){
                            let dataWin = {
                                player: rooms[index].player[2],
                                host: rooms[index].host[2],
                                win: 'host',
                                playerFirst: 'host'
                            }
                            io.sockets.in(rooms[index].host[0]).emit("end-game-res",dataWin);
                        }
                        rooms[index].isStart = false;
                        return;
                    }
                })
                
            }
        })
    })
});

server.listen(port, () => {
    console.log(`server dang lang nghe port: ${port}`);
});