const mongoose = require('mongoose');
async function connect(){
    try {
        await mongoose.connect('mongodb://localhost:27017/gamecaro');
        console.log("connect success!!!");
    } catch (error) {
        console.log("connect fail!!!");
    }
}

module.exports = { connect };