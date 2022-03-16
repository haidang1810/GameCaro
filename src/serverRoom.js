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

let board = [];
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
        player: ["","",0],
        board: board,
        turn: 1
    },
    {
        roomID: "",
        password: "",
        host: ["","",0],
        player: ["","",0],
        board: board,
        turn: 1
    },
    {
        roomID: "",
        password: "",
        host: ["","",0],
        player: ["","",0],
        board: board,
        turn: 1
    },
]

io.on('connection', socket => {
    socket.on("listRoom-req", function(){
        socket.emit("listRoom-res", rooms);
    })
    socket.on("user-join-room-req", function(data){
        var roomIndex = data.roomIndex - 1;
        var nickName = data.nickName;
        if(rooms[roomIndex].host[1]==""){
            let data = {
                status:  1,
                player: "host",
                msg: "success!"
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
                    msg: "success!"
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
                lostTotal: 0,
                roomWined: rooms[roomIndex].host[2]
            },
            player: {
                nickName: "",
                winTotal: 0,
                lostTotal: 0,
                roomWined: rooms[roomIndex].player[2]
            }
        };
        User.findOne({
            nickName: rooms[roomIndex].host[1]
        }).then((data) => {
            if(data){
                data_player_rooms.host.nickName = data.nickName;
                data_player_rooms.host.winTotal = data.winTotal;
                data_player_rooms.host.lostTotal = data.lostTotal;
            }
        }).then(()=>{
            User.findOne({
                nickName: rooms[roomIndex].player[1]
            }).then((data) => {
                if(data){
                    data_player_rooms.player.nickName = data.nickName;
                    data_player_rooms.player.winTotal = data.winTotal;
                    data_player_rooms.player.lostTotal = data.lostTotal;
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
    socket.on("disconnect", function(){
        rooms.forEach((value,index) => {
            if(value.player[0]==socket.id){
                rooms[index].player[0] = "";
                rooms[index].player[1] = "";
                let data_res_update_room = {
                    roomIndex: index,
                    room: rooms[index]
                };
                io.sockets.in(value.roomID).emit("player-out","");
                io.sockets.emit("update-room-res",data_res_update_room);
                return;
            }
            if(value.host[0]==socket.id){
                User.findOne({
                    nickName: value.host[1]
                }).then((dataDB)=>{
                    if(dataDB){
                        let data_change_position = {
                            nickName: dataDB.nickName,
                            winTotal: dataDB.winTotal,
                            lostTotal: dataDB.lostTotal,
                            roomWined:  rooms[index].player[2]
                        }
                        io.sockets.in(value.roomID).emit("change-position-res",data_change_position);
                        rooms[index].roomID = rooms[index].player[0];
                        rooms[index].host[0] = rooms[index].player[0];
                        rooms[index].host[1] = rooms[index].player[1];
                        rooms[index].player[0] = "";
                        rooms[index].player[1] = "";
                        let data_res_update_room = {
                            roomIndex: index,
                            room: rooms[index]
                        };
                        io.sockets.emit("update-room-res",data_res_update_room);
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