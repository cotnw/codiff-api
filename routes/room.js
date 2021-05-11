const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');

router.get('/', (req, res) => {
    res.send('hello world');
});

router.post('/join', async (req,res) => {
    let user = await User.findOne({access_token: req.query.access_token}) // get User from database
    let room = await Room.findOne({git_repo_url: req.body.git_repo_url, branch: req.body.branch, revision_id: req.body.revision_id}) // get Room from database
    let collaborators = []
    let ownerRepo = req.body.git_repo_url.split('github.com/')[1] // convert the user 
    try {
        await axios.get(`https://api.github.com/repos/${ownerRepo}/collaborators`,{headers: {'Authorization': `Bearer ${req.query.access_token}`}}).then(( response => {
            response.data.forEach(user => {
                collaborators.push(user.login)
            })
        }))
    } catch(err) {
        res.json({success: false, error: err})
    }
    if (user) { // check if user exists
        if (room) { // check if room exists
            await Room.findOneAndUpdate({git_repo_url: req.body.git_repo_url, branch: req.body.branch, revision_id: req.body.revision_id}, {collaborators: room.collaborators}) // update room collaborators on the database
            if (collaborators.contains(user.username)) {
                room.online.push(user.username)
                await Room.findOneAndUpdate({git_repo_url: req.body.git_repo_url, branch: req.body.branch, revision_id: req.body.revision_id}, {online: room.online}) // update online participants
                res.json({success: true, room_id: room._id}) // request is successful; send Room id as response
            } else {
                res.json({success: false, error: "You aren't alowed to join the room. You aren't a collaborator on this repository."}) // return if user is not a collaborator
            }
        } else {
            try{
                await axios.get(`https://api.github.com/repos/${ownerRepo}/branches`,{headers: {'Authorization': `Bearer ${req.query.access_token}`}}).then(( async response => {
                    response.data.forEach(async branch => {
                        if (req.body.branch == branch.name) {
                            if (req.body.revision_id == branch.commit.sha) {
                                let newRoom = Room({
                                    git_repo_url: req.body.git_repo_url,
                                    branch: req.body.branch,
                                    revision_id: req.body.revision_id,
                                    online: [user.username],
                                    collaborators: collaborators
                                })
                                await newRoom.save() // save new Room
                                res.json({success: true, room_id: newRoom._id}) // return new Room id
                            } else {
                                res.json({success: false, error: "Update your local repository to the latest commit."}) // return if user's repository is not the latest
                            }
                        }
                    })
                }))
            } catch (err) {
                res.json({success: false, error: err})
            }   
        }
    } else {
        res.json({success: false, error: "User not found."}) // User doesn't exist in the database
    }
})

module.exports = router