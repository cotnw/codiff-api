const mongoose = require('mongoose')

const RoomSchema = new mongoose.Schema({
    git_repo_url: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    revision_id: {
        type: String,
        required: true
    },
    online: {
        type: Array,
        default: []
    },
    collaborators: {
        type: Array,
        default: []
    },
    latest: {
        type: Boolean,
        default: true
    }
})

const Room = mongoose.model('Room', RoomSchema)

module.exports = Room