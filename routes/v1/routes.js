const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.status(200).json({ message: 'success' })
})

router.use('/hello', require('./subroutes/hello'))
router.use('/matches', require('./subroutes/matches'))

module.exports = router
