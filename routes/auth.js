const express = require('express')
const axios = require('axios')
const router = express.Router()
const User = require('../models/User')
const { oauthHeader } = require('../controllers/constants')

router.get('/', (req, res) => {
    res.redirect('https://github.com/login/oauth/authorize?client_id=45f28c0f178cb8c343ab&scope=repo&read:org')
})

router.get('/callback', (req, res) => {
    let code = req.query.code
    axios.post('https://github.com/login/oauth/access_token', {
            client_id: '45f28c0f178cb8c343ab',
            client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
            code: code
        })
        .then(async(response) => {
            let accessToken = response.data.split('&')[0].split('=')[1]
            let profileRes = await axios.get('https://api.github.com/user', oauthHeader(accessToken))
            let username = profileRes.data.login
            let img = profileRes.data.avatar_url
            User.findOne({ username: username }).then(async (user) => {
                if (!user) { //see if user already exists
                    let newUser = User({
                        username,
                        access_token: accessToken,
                        img
                    })
                    await newUser.save()
                } else { //if user exists, update access token
                    if (accessToken != user.access_token) {
                        user.access_token = accessToken
                        await user.save()
                    }
                }
            })
            res.redirect(`http://localhost:15015/callback/${accessToken}`) //redirect for vscode extension to fetch token
        })
        .catch(function(error) {
            console.log(error)
        })
})

module.exports = router