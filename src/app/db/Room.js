const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const Room = new Schema({
    number: {type: String},
    password: {type: String, default:''},
    timePerTurn: {type: Number, default: -1},
    Player: {type: String, default:''},
    tokkenRemember: {type: String, default:''},
    tokkenLogin: {type: String, default:''}
});

module.exports = mongoose.model('Room', Room);