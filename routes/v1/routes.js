const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.status(200).json({ message: 'success' })
})

router.use('/songRequests', require('./subroutes/songRequests'))

module.exports = router
