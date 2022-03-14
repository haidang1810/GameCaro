const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const User = new Schema({
    email: {type: String},
    nickName: {type: String},
    password: {type: String},
    refreshToken: {type: String, default:''},
    rememberToken: {type: String, default:''},
});

module.exports = mongoose.model('User', User);