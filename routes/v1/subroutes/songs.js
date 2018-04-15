const express = require('express')
const router = express.Router()
const lib = require('../../../lib/lib')
const errors = require('../../../lib/errors')

function completeAudioReplacement(req, res, next) {
  lib.completeReplaceAudioForSong({ songID: req.params.songID, key: req.body.key })
    .then(result => res.send(200).json(result))
    .catch(err => res.send(err.statusCode).json({ message: err.message }))
}

function requestAudioReplacement(req, res, next) {
  lib.completeReplaceAudioForSong({ youTubeID: req.body.youTubeID || req.body.youtubeID,
                                    songID: req.params.songID })
    .then(result => res.send(200).json(result))
    .catch(err => res.send(err.statusCode).json({ message: err.message }))
}

router.post('/:songID/completeAudioReplacement', replaceAudio)
router.put('/:songID/requestAudioReplacement', requestReplacementAudio)

module.exports = router
