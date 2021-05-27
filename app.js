const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const socketIO = require('socket.io')
const User = require('./models/User')
const Room = require('./models/Room')
require('dotenv').config();

const indexRouter = require('./routes/index')
const userRouter = require('./routes/user')
const authRouter = require('./routes/auth')
const roomRouter = require('./routes/room')

const db = process.env.MONGODB_URL

const app = express()

const port = process.env.PORT || 3000
const server = app.listen(port, (err) => {
    console.log(`API listening on ${port}!`)
    if (err) throw err
})

const io = socketIO(server, { cors: true, origins: '*:*' })

mongoose.connect(db, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err))
mongoose.set('useFindAndModify', false)

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/user', userRouter)
app.use('/auth', authRouter)
app.use('/room', roomRouter)

io.on('connection', socket => {
    console.log('a user connected: ' + socket.id)
    socket.on('disconnect', async() => { // Disconnect event
        let user = await User.findOne({ socket_id: socket.id })
        if (user) {
            user.socket_id = "" // Delete socketID from database
            user.save()
            user.rooms.forEach(async room => {
                let dbRoom = await Room.findOne({_id: room})
                let i = dbRoom.online.indexOf(user.username);
                if (i > -1) {
                    dbRoom.online.splice(i, 1);
                    await Room.findOneAndUpdate({_id: dbRoom._id}, {online: dbRoom.online})
                }
            })
        }
    })
    socket.on('save', async(saveObject) => {
        let user = await User.findOne({access_token: saveObject.accessToken})
        if (user.rooms.includes(saveObject.roomID)) {
            socket.to(saveObject.roomID).emit('save', {
                username: user.username,
                relativePath: saveObject.relativePath,
                code: saveObject.code
            });
        }
    })
    socket.on('join', async(joinObject) => {
        let user = await User.findOne({access_token: joinObject.accessToken})
        if (user.rooms.includes(joinObject.roomID)) {
            socket.join(joinObject.roomID)
        }
    })
    socket.on('push', async(pushObject) => {
        let user = await User.findOne({access_token: pushObject.accessToken})
        if (user.rooms.includes(pushObject.roomID)) {
            pushObject.gitObject.username = user.username
            socket.to(pushObject.roomID).emit('push', pushObject.gitObject);
        }
    })
    socket.on('leave', async(leaveObject) => {
        let user = await User.findOne({access_token: leaveObject.accessToken})
        let room = await Room.findOne({_id: leaveObject.roomID})
        if (user.rooms.includes(leaveObject.roomID)) {
            socket.leave(leaveObject.roomID)
            let i = room.online.indexOf(user.username)
            if (i > -1) {
                room.online.splice(i, 1)
                await Room.findOneAndUpdate({_id:room._id}, {online: room.online})
            }
            let index = user.rooms.indexOf(room._id)
            if (index > -1) {
                user.rooms.splice(index, 1)
                await User.findOneAndUpdate({access_token: leaveObject.accessToken}, {rooms: user.rooms})
            }
        }
    })
})

module.exports = app
