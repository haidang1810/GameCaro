const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const User = new Schema({
    email: {type: String},
    nickName: {type: String},
    password: {type: String},
    winTotal: {type: Number, default: 0},
    lostTotal: {type: Number, default: 0},
    refreshToken: {type: String, default:''},
    rememberToken: {type: String, default:''},
});

module.exports = mongoose.model('User', User);