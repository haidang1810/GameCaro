'use strict';
const path = require('path');
const express = require('express');
const { engine } = require('express-handlebars');
const port = process.env.PORT || 2000;
const app = express();
const  db = require('./config/db')
const User = require('./app/db/User');
const server = require("http").Server(app);
const io = require("socket.io")(server);
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config()
const cookieParser = require('cookie-parser');
const nodemailer = require("nodemailer");
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


io.on('connection', socket => {
    socket.on("user-login-req", function(data){
        io.sockets.emit("user-login-res", data);
    })
    socket.on("user-send-message", function(data){
        io.sockets.emit("server-send-message", data);
    })
});

const checkRefreshToken = (req,res,next) => {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) {
        const rememberToken = req.cookies.rememberToken;
        if(rememberToken){
            User.findOne({rememberToken})
                .then((data) => {
                    if(data){
                        jwt.verify(rememberToken, process.env.ACCESS_TOKEN_SECRET, (err, dataRemember) => {
                            next();
                        });
                    }else return res.redirect("/");
                })
        }else return res.redirect("/");
    }else{
        User.findOne({
            refreshToken
        }).then((data) => {
            if(data)
                next();
            else
                return res.redirect("/");
        }).catch(()=>{
            return res.redirect("/");
        })
    }
}

app.get('/', (req, res) => {
    const rememberToken = req.cookies.rememberToken;
    if(rememberToken){
        User.findOne({rememberToken})
            .then((data) => {
                if(data){
                    jwt.verify(rememberToken, process.env.ACCESS_TOKEN_SECRET, (err, dataRemember) => {
                        if(err) return res.render('login');
                        return res.redirect('/home');
                    });
                }else return res.render('login');
            })
    }else{
        const cookieRefreshToken = req.cookies.refreshToken;
        if(!cookieRefreshToken) return res.render('login');
        const cookie = req.cookies.accessToken;
        if(!cookie) return res.render('login');
        jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
            if(err) return res.render('login');
            return res.redirect('/home');
        });
    }
    
    
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
                                    cookie: cookie,
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
app.get('/room', checkRefreshToken, (req, res) => {
    if(!req.query.id) return res.redirect("/home");
    var id = req.query.id;
    const rememberToken = req.cookies.rememberToken;
    if(rememberToken){
        User.findOne({rememberToken})
            .then((data) => {
                if(data){
                    jwt.verify(rememberToken, process.env.ACCESS_TOKEN_SECRET, (err, dataRemember) => {
                        let data = {
                            id,
                            nickName: dataRemember.nickName
                        };
                        if (err) return res.redirect("/");
                        return res.render('room/room',{
                            data
                        });
                    });
                }
            })
    }else{
        const cookie = req.cookies.accessToken;
        jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET, (err, dataToken) => {
            let data = {
                id,
                nickName: dataToken.nickName
            };
            if (err) return res.redirect("/");
            return res.render('room/room',{
                data
            });
        });
    }
})
app.get('/home', checkRefreshToken, (req, res) => {
    const rememberToken = req.cookies.rememberToken;
    if(rememberToken){
        User.findOne({rememberToken})
            .then((data) => {
                if(data){
                    jwt.verify(rememberToken, process.env.ACCESS_TOKEN_SECRET, (err, dataRemember) => {
                        if (err) return res.redirect("/");
                        return res.render('room/listRoom',{
                            data: dataRemember
                        });
                    });
                }else{
                    const cookie = req.cookies.accessToken;
                    jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
                        if (err) return res.redirect("/");
                        return res.render('room/listRoom',{
                            data
                        });
                    });
                }
            })
    }else{
        const cookie = req.cookies.accessToken;
        jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
            if (err) return res.redirect("/");
            return res.render('room/listRoom',{
                data
            });
        });
    }
});
app.post('/refreshToken', (req, res) => {
    const rememberToken = req.cookies.rememberToken;
    if(rememberToken){
        User.findOne({rememberToken})
            .then((data) => {
                if(data){
                    jwt.verify(rememberToken, process.env.ACCESS_TOKEN_SECRET, (err, dataRemember) => {
                        if (err) return res.redirect("/");
                        const accessToken = jwt.sign({ nickName: data.nickName },process.env.ACCESS_TOKEN_SECRET,{
                            expiresIn: '40s',
                        });
                        return res.json({ status: 1, accessToken });
                    });
                }else return res.redirect("/");
            })
    }else{
        const refreshToken = req.body.token;
        if (!refreshToken) return res.redirect("/");
        User.findOne({refreshToken})
            .then((dataDB)=>{
                if(dataDB){
                    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, data) => {
                        if (err) return res.redirect("/");
                        const accessToken = jwt.sign({ nickName: data.nickName },process.env.ACCESS_TOKEN_SECRET,{
                            expiresIn: '40s',
                        });
                        return res.json({ status: 1, accessToken });
                    });
                }else return res.redirect("/");
            }).catch(()=>{
                return res.redirect("/");
            })
    }
});
app.get('/crown', checkRefreshToken, (req, res) => {
    const cookie = req.cookies.accessToken;
    if(!cookie){
        const rememberToken = req.cookies.rememberToken;
        if(rememberToken){
            User.findOne({rememberToken})
                .then((data) => {
                    if(data){
                        cookie = rememberToken;
                    }else return res.redirect("/");
                    jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
                        if (err) return res.redirect("/");
                        User.find({}).sort('winTotal')
                            .then((dataDB)=>{
                                if(dataDB){
                                    dataDB.reverse();
                                    var players = new Array();
                                    let playerRating = 0;
                                    dataDB.forEach((value,index) => {
                                        let top = index+1;
                                        let player = {
                                            top,
                                            nickName: value.nickName,
                                            winTotal: value.winTotal
                                        }
                                        players.push(player);
                                        if(data.nickName==value.nickName)
                                            playerRating = index+1;
                                    })
                                    data.players = players;
                                    data.playerRating = playerRating;
                                    return res.render('crown',{
                                        data
                                    });
                                }
                            }).catch(()=>{return res.redirect("/");})
                        
                    });
                })
        }else return res.redirect("/");
    }else{
        jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
            if (err) return res.redirect("/");
            User.find({}).sort('winTotal')
                .then((dataDB)=>{
                    if(dataDB){
                        dataDB.reverse();
                        var players = new Array();
                        let playerRating = 0;
                        dataDB.forEach((value,index) => {
                            let top = index+1;
                            let player = {
                                top,
                                nickName: value.nickName,
                                winTotal: value.winTotal
                            }
                            players.push(player);
                            if(data.nickName==value.nickName)
                                playerRating = index+1;
                        })
                        data.players = players;
                        data.playerRating = playerRating;
                        return res.render('crown',{
                            data
                        });
                    }
                }).catch(()=>{return res.redirect("/");})
            
        });
    }
})
app.get("/profile", checkRefreshToken, (req,res)=>{
    const cookie = req.cookies.accessToken;
    if(!cookie){
        const rememberToken = req.cookies.rememberToken;
        if(rememberToken){
            User.findOne({rememberToken})
                .then((data) => {
                    if(data){
                        cookie = rememberToken;
                    }else return res.redirect("/");
                    jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
                        if (err) return res.redirect("/");
                        User.findOne({nickName: data.nickName})
                            .then((dataDB)=>{
                                if(dataDB){
                                    data.winTotal = dataDB.winTotal;
                                    data.loseTotal = dataDB.loseTotal;
                                    data.total = dataDB.loseTotal+dataDB.winTotal;
                                    data.percent = (data.winTotal/data.total*100).toFixed(1);
                                    data.email = dataDB.email;
                                    return res.render('profile',{
                                        data
                                    });
                                }
                            }).catch(()=>{return res.redirect("/");})
                        
                    });
                })
        }else return res.redirect("/");
    }else{
        jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
            if (err) return res.redirect("/");
            User.findOne({nickName: data.nickName})
                .then((dataDB)=>{
                    if(dataDB){
                        data.winTotal = dataDB.winTotal;
                        data.loseTotal = dataDB.loseTotal;
                        data.total = dataDB.loseTotal+dataDB.winTotal;
                        data.percent = (data.winTotal/data.total*100).toFixed(1);
                        data.email = dataDB.email;
                        return res.render('profile',{
                            data
                        });
                    }
                }).catch(()=>{return res.redirect("/");})
            
        });
    }
})
app.post("/profile", checkRefreshToken, (req,res)=>{
    const cookie = req.cookies.accessToken;
    if(!cookie){
        const rememberToken = req.cookies.rememberToken;
        if(rememberToken){
            User.findOne({rememberToken})
                .then((data) => {
                    if(data){
                        cookie = rememberToken;
                    }else return res.redirect("/");
                    jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
                        if (err) return res.redirect("/");
                        if(!req.body.cPassword && !req.body.nPassword){
                            console.log("req", req);
                            User.updateOne({nickName: data.nickName},{
                                nickName: req.body.nickName, 
                                email: req.body.email
                            })
                                .then(()=>{
                                    res.json({
                                        status: 1,
                                        msg: "Cập nhật thành công. Bạn sẽ được chuyển đến trang đăng nhập"
                                    });
                                })
                                .catch(()=>{
                                    res.json({
                                        status: 2,
                                        msg: "Lỗi server !!!"
                                    })
                                })
                        }else{
                            User.findOne({nickName: data.nickName})
                                .then((dataDB) => {
                                    bcrypt.compare(req.body.password, dataDB.password, function(err, result) {
                                        if(err) res.json({
                                            status: 2,
                                            msg: "Lỗi server !!!"
                                        })
                                        if(result){
                                            bcrypt.hash(req.body.nPassword, saltRounds, function(err, hash) {
                                                if(err) res.json({
                                                    status: 2,
                                                    msg: "Lỗi server !!!"
                                                })
                                                let password = hash;
                                
                                                const user = {
                                                    nickName: req.body.nickName,
                                                    email: req.body.email,
                                                    password
                                                };
                                                User.updateOne({nickName: dataDB.nickName},user)
                                                .then(() => {
                                                    res.json({
                                                        status: 1,
                                                        msg: "Cập nhật thành công. Bạn sẽ được chuyển đến trang đăng nhập.",
                                                    })
                                                })
                                                .catch(()=>{
                                                    res.json({
                                                        status: 2,
                                                        msg: "Lỗi server !!!"
                                                    })
                                                })
                                            });
                                        }else{
                                            res.json({
                                                status: 2,
                                                msg: "Mật khẩu không chính xác !"
                                            })
                                        }
                                    });
                                })
                            
                        }
                    });
                })
        }else return res.redirect("/");
    }else{
        jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
            if (err) return res.redirect("/");
            if(!req.body.cPassword && !req.body.nPassword){
                console.log("req", req);
                User.updateOne({nickName: data.nickName},{
                    nickName: req.body.nickName, 
                    email: req.body.email
                })
                    .then(()=>{
                        res.json({
                            status: 1,
                            msg: "Cập nhật thành công. Bạn sẽ được chuyển đến trang đăng nhập"
                        });
                    })
                    .catch(()=>{
                        res.json({
                            status: 2,
                            msg: "Lỗi server !!!"
                        })
                    })
            }else{
                User.findOne({nickName: data.nickName})
                    .then((dataDB) => {
                        bcrypt.compare(req.body.password, dataDB.password, function(err, result) {
                            if(err) res.json({
                                status: 2,
                                msg: "Lỗi server !!!"
                            })
                            if(result){
                                bcrypt.hash(req.body.nPassword, saltRounds, function(err, hash) {
                                    if(err) res.json({
                                        status: 2,
                                        msg: "Lỗi server !!!"
                                    })
                                    let password = hash;
                    
                                    const user = {
                                        nickName: req.body.nickName,
                                        email: req.body.email,
                                        password
                                    };
                                    User.updateOne({nickName: dataDB.nickName},user)
                                    .then(() => {
                                        res.json({
                                            status: 1,
                                            msg: "Cập nhật thành công. Bạn sẽ được chuyển đến trang đăng nhập.",
                                        })
                                    })
                                    .catch(()=>{
                                        res.json({
                                            status: 2,
                                            msg: "Lỗi server !!!"
                                        })
                                    })
                                });
                            }else{
                                res.json({
                                    status: 2,
                                    msg: "Mật khẩu không chính xác !"
                                })
                            }
                        });
                    })
                
            }
        });
    }
    
})
app.get("/forgot", (req, res) => {
    res.render("forgotPassword");
})
const createVerifyCode = (length) => {
    let code = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++)
    code += possible.charAt(Math.floor(Math.random() * possible.length));
    return code;
}
async function sendVerifyCode(to,verifyCode,name) {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_APP, // generated ethereal user
            pass: process.env.EMAIL_APP_PASSWORD, // generated ethereal password
        },
    });
    let info = await transporter.sendMail({
        from: '"Caro Online 👻" <caroonline1810@gmail.com', // sender address
        to: to, // list of receivers
        subject: "Mã xác nhận mật khẩu", // Subject line
        html: `
        <h3>Xin chào ${name}</h3>
        <p>Bạn vừa gửi yêu cầu quên mật khẩu trên caro online</p>
        <p style='color:red'><i>Lưu ý: Nếu bạn không thực hiện thao tác trên vui lòng bỏ qua mail này</i></p>
        <h4>Mã xác nhận của bạn</h4>
        <h3 style='background-color: #c1c1c1;display: block; padding: 10px 20px'>${verifyCode}</h3>
        <p>Mã xác nhận chỉ có hiệu lực trong 3 phút</p>
        `, 
    });
}
var arrayVerifyList = [];
app.post("/forgot/verify", (req, res)=>{
    let email = req.body.email;
    User.findOne({email})
        .then((data)=>{
            if(data){
                let verifyCode = createVerifyCode(8);
                const date = new Date();
                let dataVerify = {
                    email: email,
                    verifyCode: verifyCode,
                    time: date.getTime()
                };
                arrayVerifyList.push(dataVerify);
                sendVerifyCode(email,verifyCode,data.nickName)
                    .then(()=> {res.json({
                        status: 1,
                        msg: "Mã xác nhận đã được gửi đến gmail của bạn"
                    })})
                    .catch(()=>{res.json({
                        status: 2,
                        msg: "Lỗi server"
                    })})
            }else{
                res.json({
                    status: 2,
                    msg: "Không tồn tại người dùng này"
                })
            }
        })
        .catch(()=>{res.json({
            status: 2,
            msg: "Lỗi server"
        })})
    
})

app.post("/forgot/change", (req,res)=>{
    let index = arrayVerifyList.findIndex(v => v.email==req.body.email);
    if(index>=0){
        if(arrayVerifyList[index].verifyCode===req.body.verifyCode){
            const d = new Date();
            const time = d.getTime();
            if(time-arrayVerifyList[index].time<=180000){
                bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
                    if(err) return res.json({
                        status: 2,
                        msg: "Lỗi server!"
                    })
                    let password = hash;
                    User.updateOne({email:req.body.email},{
                        password
                    }).then(()=>{
                        arrayVerifyList.splice(index,1);
                        return res.json({
                            status: 1,
                            msg: "Đã cập nhật mật khẩu mới !"
                        })
                    }).catch(()=>{
                        return res.json({
                            status: 2,
                            msg: "Lỗi server!"
                        })
                    })
                });
                
            }else{
                arrayVerifyList.splice(index,1);
                return res.json({
                    status: 2,
                    msg: "Mã xác nhận đã hết hạn!"
                })
            }
        }else{
            return res.json({
                status: 2,
                msg: "Mã xác nhận không chính xác!"
            })
        }
    }else{
        return res.json({
            status: 2,
            msg: "Người dung chưa yêu cầu mã xác nhận!"
        })
    }
})
server.listen(port, () => {
    console.log(`server dang lang nghe port: ${port}`);
});