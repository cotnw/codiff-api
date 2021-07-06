const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const db = process.env.MONGODB_URL

router.get('/', (req, res) => {
    mongoose.connect(db, { useUnifiedTopology: true, useNewUrlParser: true })
        .then(() => {
            res.json({ dbInitialised: true })
        })
        .catch(err => {
            res.json({ dbInitialised: false })
        })
})

module.exports = router