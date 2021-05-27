const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.redirect('https://github.com/cotnw/codiff')
})

module.exports = router