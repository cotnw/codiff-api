const express = require('express')
const router = express.Router()
const User = require('../models/User')

router.post('/socket', async (req, res) => {
    const user = await User.findOne({ access_token: req.body.accessToken })
    if (user) {
        await user.updateOne({ socket_id: req.body.socketID })
        res.sendStatus(200)
    } else {
        res.sendStatus(401)
    }
})

module.exports = router