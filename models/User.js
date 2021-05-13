const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    access_token: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true
    },
    socket_id: {
        type: String,
        required: false
    },
    rooms: {
        type: Array,
        default: []
    }
})

const User = mongoose.model('User', UserSchema)

module.exports = User