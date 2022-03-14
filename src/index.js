'use strict';
const path = require('path');
const express = require('express');
const { engine } = require('express-handlebars');
const port = 2000;
const app = express();
const  db = require('./config/db')
const User = require('./app/db/User');
const res = require('express/lib/response');
const server = require("http").Server(app);
const io = require("socket.io")(server);
const bcrypt = require('bcrypt');
const { time } = require('console');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config()
const cookieParser = require('cookie-parser');
const { find } = require('./app/db/User');
db.connect();

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());

//Template engine 
app.engine('hbs', engine({
    extname: '.hbs'
}));
app.set('view engine','hbs');
app.set('views', path.join(__dirname, 'resources/views'));

var userOnline = [];

io.on('connection', socket => {
    
});

app.get('/', (req, res) => {
    const rememberToken = req.cookies.rememberToken;
    if(rememberToken){
        User.findOne({rememberToken})
            .then((data) => {
                if(data){
                    jwt.verify(rememberToken, process.env.ACCESS_TOKEN_SECRET, (err, dataRemember) => {
                        if(err) return res.render('login');
                        return res.redirect('room/listRoom');
                    });
                }else return res.render('login');
            })
    }
    const cookie = req.cookies.accessToken;
    if(!cookie) return res.render('login');
    jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
        if(err) return res.render('login');
        return res.redirect('room/listRoom');
    });
    
});
app.post('/', (req, res) => {
    let formData = req.body;
    User.findOne({
        email: formData.email,
    })
    .then((data) => {
        if(data){
            bcrypt.compare(formData.password, data.password, function(err, result) {
                if(result){
                    let dataUpdate = data;
                    let value = {nickName: dataUpdate.nickName};
                    const accessToken = jwt.sign(value, process.env.ACCESS_TOKEN_SECRET,{
                        expiresIn: '40s',
                    });
                    const refreshToken = jwt.sign(value, process.env.REFRESH_TOKEN_SECRET);
                    dataUpdate.refreshToken = refreshToken;
                    if(formData.remember!=""){
                        const cookie = jwt.sign({ nickName: data.nickName },process.env.ACCESS_TOKEN_SECRET,{
                            expiresIn: '3d',
                        });
                        dataUpdate.rememberToken = cookie;
                        User.updateOne({nickName: data.nickName},dataUpdate)
                            .then(()=>{
                                return res.json({
                                    status: 1,
                                    msg: "login success!",
                                    cookie: hash,
                                    accessToken,
                                    refreshToken
                                })
                            })
                    }else{
                        User.updateOne({nickName: data.nickName},dataUpdate)
                            .then(()=>{
                                return res.json({
                                    status: 1,
                                    msg: "login success!",
                                    cookie: "",
                                    accessToken,
                                    refreshToken
                                })
                            })
                    }
                }else{
                    return res.json({
                        status: 2,
                        msg: "Mật khẩu không chính xác"
                    });
                }
            });
            
        }else{
            return res.json({
                status: 2,
                msg: "Tài khoản không tồn tại"
            });
        }
    })
});
app.get('/register', (req, res) => {
    res.render('register');
});
app.post('/register', (req, res) => {
    let formData = req.body;
        User.findOne({
            nickName: formData.nickName
        })
        .then((dataNickName) => {
            if(dataNickName){
                res.json({
                    status: 2,
                    msg: "Biệt danh đã tồn tại"
                })
            }else{
                User.findOne({
                    email: formData.email
                })
                .then((dataEmail) => {
                    if(dataEmail){
                        res.json({
                            status: 2,
                            msg: "Email đã tồn tại"
                        })
                    }else{
                        bcrypt.hash(formData.password, saltRounds, function(err, hash) {
                            formData.password = hash;
                            let value = {
                                nickName: formData.nickName
                            }
                            const accessToken = jwt.sign(value, process.env.ACCESS_TOKEN_SECRET,{
                                expiresIn: '40s',
                            });
                            const refreshToken = jwt.sign(value, process.env.REFRESH_TOKEN_SECRET);
                            formData.refreshToken = refreshToken;
                            const user = new User(formData);
                            user.save()
                            .then(() => {
                                res.json({
                                    status: 1,
                                    msg: "success!",
                                    accessToken,
                                    refreshToken
                                })
                            })
                        });
                        
                    }
                })
            }
        })    
});
app.get('/room', (req, res) => {
    const cookie = req.cookies.accessToken;
    jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
        if (err) return res.redirect("/");
        return res.render('room/listRoom',{
            data
        });
    });
    
});
app.post('/refreshToken', (req, res) => {
    const refreshToken = req.body.token;
    if (!refreshToken) return res.json({
        status: 2,
        msg: "Not login"
    });
    User.findOne({refreshToken})
        .then((dataDB)=>{
            if(dataDB){
                jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, data) => {
                    if (err) return res.json({
                        status: 2,
                        msg: "Not login"
                    });
                    const accessToken = jwt.sign({ nickName: data.nickName },process.env.ACCESS_TOKEN_SECRET,{
                        expiresIn: '40s',
                    });
                    return res.json({ status: 1, accessToken });
                });
            }else return res.json({
                status: 2,
                msg: "Not login"
            });
        })
});
server.listen(port, () => {
    console.log(`server dang lang nghe port: ${port}`);
});