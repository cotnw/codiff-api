const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');

const db = process.env.MONGODB_URL;

const app = express();

mongoose.connect(db, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));
mongoose.set('useFindAndModify', false);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', indexRouter);
app.use('/auth', authRouter);

const port = process.env.PORT || 3000
app.listen(port, (err) => {
    console.log(`API listening on ${port}!`)
    if (err) throw err
})

module.exports = app;