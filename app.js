const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const socketIO = require('socket.io');
require('dotenv').config();

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const roomRouter = require('./routes/room')

const db = process.env.MONGODB_URL;

const app = express();

const port = process.env.PORT || 3000;
const server = app.listen(port, (err) => {
    console.log(`API listening on ${port}!`);
    if (err) throw err;
});

const io = socketIO(server, { cors: true, origins: '*:*' });

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
app.use('/room', roomRouter);

io.on('connection', socket => {
    console.log('a user connected: ' + socket.id);
    socket.on('disconnect', async() => { // Disconnect event
        let user = await User.findOne({ socket_id: socket.id })
        if (user) {
            user.socket_id = "" // Delete socketID from database
            user.save()
        }
    })
    socket.on('save', async(saveObject) => {
        socket.broadcast.emit('save', saveObject)
    })
})

module.exports = app;