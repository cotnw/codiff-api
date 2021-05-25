const express = require('express')
const axios = require('axios')
const router = express.Router()
const User = require('../models/User')
const Room = require('../models/Room')

router.get('/', (req, res) => {
    res.send('hello world')
})

router.post('/join', async(req, res) => {
    let user = await User.findOne({ access_token: req.query.access_token }) // get User from database
    let room = await Room.findOne({ git_repo_url: req.body.git_repo_url, branch: req.body.branch, revision_id: req.body.revision_id }) // get Room from database
    let collaborators = []
    let ownerRepo = req.body.git_repo_url.split('github.com/')[1] // convert the user 
    await axios.get(`https://api.github.com/repos/${ownerRepo}/collaborators`, { headers: { 'Authorization': `Bearer ${req.query.access_token}` } }).then((response => {
        response.data.forEach(user => {
            collaborators.push(user.login)
        })
    })).catch(err => {
        res.json({ success: false, error: 'Failed to join room.' })
        console.log(err)
    })
    if (user) { // check if user exists
        await axios.get(`https://api.github.com/repos/${ownerRepo}/branches`, { headers: { 'Authorization': `Bearer ${req.query.access_token}` } }).then((async response => {
            response.data.forEach(async branch => {
                if (req.body.branch == branch.name) {
                    if (req.body.revision_id != branch.commit.sha) {
                        res.json({ success: false, error: "Update your local repository to the latest commit." })
                    } else {
                        if (room) { // check if room exists
                            await Room.findOneAndUpdate({ git_repo_url: req.body.git_repo_url, branch: req.body.branch, revision_id: req.body.revision_id }, { collaborators: room.collaborators }) // update room collaborators on the database
                            if (collaborators.includes(user.username)) {
                                if (!room.online.includes(user.username)) {
                                    room.online.push(user.username)
                                    await Room.findOneAndUpdate({ git_repo_url: req.body.git_repo_url, branch: req.body.branch, revision_id: req.body.revision_id }, { online: room.online }) // update online participants
                                }
                                if (room.latest) {
                                    if (!user.rooms.includes(room._id)) {
                                        user.rooms.push(room._id)
                                        await User.findOneAndUpdate({ access_token: req.query.access_token }, { rooms: user.rooms })
                                    }
                                    res.json({ success: true, room_id: room._id }) // request is successful; send Room id as response
                                } else {
                                    res.json({ success: false, error: "Update your local repository to the latest commit." })
                                }
                            } else {
                                res.json({ success: false, error: "You aren't alowed to join the room. You aren't a collaborator on this repository." }) // return if user is not a collaborator
                            }
                        } else {
                            try {
                                let oldRoom = await Room.findOne({ git_repo_url: req.body.git_repo_url, branch: req.body.branch, latest: true })
                                if (oldRoom) {
                                    let i = oldRoom.online.indexOf(user.username)
                                    if (i > -1) {
                                        oldRoom.online.splice(i, 1)
                                        await Room.findOneAndUpdate({ _id: oldRoom._id }, { online: oldRoom.online, latest: false })
                                    }
                                    let index = user.rooms.indexOf(oldRoom._id)
                                    if (index > -1) {
                                        user.rooms.splice(index, 1)
                                        await User.findOneAndUpdate({ access_token: req.query.access_token }, { rooms: user.rooms })
                                    }
                                }
                                let newRoom = Room({
                                    git_repo_url: req.body.git_repo_url,
                                    branch: req.body.branch,
                                    revision_id: req.body.revision_id,
                                    online: [user.username],
                                    collaborators: collaborators,
                                    latest: true
                                })
                                await newRoom.save() // save new Room
                                user.rooms.push(newRoom._id)
                                await User.findOneAndUpdate({ access_token: req.query.access_token }, { rooms: user.rooms })
                                res.json({ success: true, room_id: newRoom._id }) // return new Room id
                            } catch (err) {
                                console.log(err)
                                res.json({ success: false, error: `Couldn't create room.` })
                            }
                        }
                    }
                }
            })
        }))
    } else {
        res.json({ success: false, error: "User not found." }) // User doesn't exist in the database
    }
})

module.exports = router