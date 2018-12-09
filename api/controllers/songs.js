const lib = require('../../lib/lib')
const songs = require('../../lib/songs')

function completeAudioReplacement(req, res, next) {
  lib.completeReplaceAudioForSong({ songID: req.params.songID, key: req.body.key })
    .then(result => res.status(200).json(result))
    .catch(err => res.status(err.statusCode).json({ message: err.message }))
}

function requestAudioReplacement(req, res, next) {
  lib.completeReplaceAudioForSong({ youTubeID: req.body.youTubeID || req.body.youtubeID,
                                    songID: req.params.songID })
    .then(result => res.status(200).json(result))
    .catch(err => res.status(err.statusCode).json({ message: err.message }))
}

function getBatch(req, res, next) {
  songs.getByIDs(req.query.songIDs)
    .then(result => res.status(200).json(result))
    .catch(err => res.status(err.statusCode).json({ message: err.message }))
}

module.exports = {
  completeAudioReplacement,
  requestAudioReplacement,
  getBatch
}