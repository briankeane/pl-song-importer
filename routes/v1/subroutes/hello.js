const express = require('express')
const router = express.Router()
const lib = require('../../../lib/lib')

router.get('/', (req, res, next) => {
  lib.hello().then(world => {
      res.status(200).json({world})
  })
})

module.exports = router
