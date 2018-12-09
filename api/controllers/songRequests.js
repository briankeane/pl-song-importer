const lib = require('../../lib/lib')
const errors = require('../../lib/errors')
const Song = require('../../lib/mongoose/song')
const songRequestCache = require('../../lib/cache/songRequest')
const HttpError = require('../../lib/models/HttpError')

function getOrCreateSongRequest(req, res, next) {
  lib.getOrCreateSongRequest(req.swagger.params.spotifyID.value)
    .then(songRequest => res.status(200).json(songRequest))
    .catch(err => handleError(res, new HttpError(err.statusCode, err.message)))
}

function checkBucket(req, res, next) {
  if (req.body.bucketName !== process.env.SONGS_BUCKET_NAME) {
    console.log(`invalid bucketName: ${req.body.bucketName}`)
    return res.status(400).json({ message: errors.INVALID_BUCKET_NAME })
  }
  next()
}

function completeSongAcquisition(req, res, next) {
  lib.completeSongAcquisition({ spotifyID: req.swagger.params.spotifyID.value, key: req.body.key })
    .then(data => res.status(200).json(data))
    .catch(err => handleError(res, err))
}

//
// this is just to make massive testing easier
//
function getSpotifyIDs(req, res, next) {
  Song.getSpotifyIDs()
  .then(ids => res.status(200).json({ spotifyIDs: ids }))
  .catch(err => res.status(500).json(err))
}

function getMatchingQuery(req, res, next) {
  lib.getSongRequestsMatchingQueryString(req.query.searchText)
    .then(results => res.status(200).json(results))
    .catch(err => res.status(500).send(err))
}

function removeMatchingSpotifyID(req, res, next) {
  lib.removeSongRequestMatchingSpotifyID(req.swagger.params.spotifyID.value)
    .then(results => res.status(200).json(results))
    .catch(err => res.status(500).send(err))
}

function handleError(res, err) {
  console.log(err);
  return res.status(err.statusCode).json({ message: err.message })
}

module.exports = {
  getOrCreateSongRequest,
  checkBucket,
  completeSongAcquisition,
  getSpotifyIDs,
  getMatchingQuery,
  removeMatchingSpotifyID
}
