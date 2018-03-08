const express = require('express')
const router = express.Router()
const lib = require('../../../lib/lib')

router.get('/', (req, res, next) => {
  lib.getMatches(req.query)
    .then(matches => {res.status(200).json({matches})
    .catch(err => {res.status(err.statusCode).json({ message: err.message }) })
  })
})

module.exports = router
