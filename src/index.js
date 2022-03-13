'use strict';
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const { engine } = require('express-handlebars');
const port = 3000;
const app = express();

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded());
app.use(express.json());
//http logger
app.use(morgan('combined'));

//Template engine 
app.engine('hbs', engine({
    extname: '.hbs'
}));
app.set('view engine','hbs');
app.set('views', path.join(__dirname, 'resources/views'));


app.get('/', (req, res) => {
    res.render('login');
});
app.get('/register', (req, res) => {
    res.render('register');
});
app.get('/room', (req, res) => {
    res.render('room/listRoom');
});


app.listen(port, () => {
    console.log(`server dang lang nghe port: ${port}`);
});