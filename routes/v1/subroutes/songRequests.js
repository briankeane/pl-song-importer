const express = require('express')
const router = express.Router()
const lib = require('../../../lib/lib')
const db = require('../../../lib/db')
const events = require('../../../lib/events')
const services = require('../../../lib/services')
const youTube = require('../../../lib/services/youTube')
const errors = require('../../../lib/errors')
const status = require('../../../lib/status')
const spotify = require('../../../lib/services/spotify')
const Song = require('../../../lib/mongoose/song.model')


function checkForSong(req, res, next) {
  console.log('checking for song...')
  Song.find({ 'spotifyInfo.id': req.params.spotifyID }, function (err, foundSongs) {
    if (err) return handleError(res, err)
    if (foundSongs.length) {
      return res.status(200).send({ song: foundSongs[0], status: status.COMPLETED })
    }
    next()
  })
}

function checkForSongRequest(req, res, next) {
  console.log('checking for songRequest...')
  db.getSongRequestWithSpotifyID(req.params.spotifyID)
    .then(songRequest => res.status(200).json(songRequest))
    .catch(err => {
      (err.message === errors.SONG_REQUEST_DOES_NOT_EXIST) 
      ? next() 
      : handleError(res, err)
    })
}

function initiateAcquisition(req, res, next) {
  function finish(err, data) {
    if (err) return handleError(res, err)
    return res.status(200).json(data)
  }

  lib.createSongRequest(req.params.spotifyID)
    .then(songRequest => finish(null, songRequest))
    .catch(err => finish(err))

  // spotify.getSongWithID(req.params.spotifyID)
  //   .then(spotifyInfo => {
  //     // mark process as started in db
  //     console.log('creating songRequest')
  //     db.createSongRequest({ spotify_info: spotifyInfo, status: status.PROCESSING })
  //       .then(createdSongRequest => {
  //         console.log('calling youTube matching service')
  //         youTube.getMatches(lib.youTubeSearchDataFromSpotifyInfo(spotifyInfo))
  //           .then(matches => {
  //             if (!matches.length) {
  //               db.updateSongRequestWithID(createdRequest.id, { status: status.MATCH_NOT_FOUND })
  //               return finish({ status: status.MATCH_NOT_FOUND })
  //             } else {
  //               lib.requestAudio({ youTubeIDs: matches.map(match => match.id), spotifyID: req.params.spotifyID })
  //                 .then(result => finish(null, { status: status.PROCESSING }))
  //                 .catch(err => finish(err))
  //             }
  //           })
  //           .catch(err => finish(err))
  //       })
  //       .catch(err => finish(err))
  //   })
  //   .catch(err => finish(err))
}

function checkBucket(req, res, next) {
  if (req.body.bucketName !== process.env.SONGS_BUCKET_NAME) {
    console.log(`invalid bucketName: ${req.body.bucketName}`)
    return res.status(400).json({ message: errors.INVALID_BUCKET_NAME })
  }
  next()
}

function completeSongAcquisition(req, res, next) {
  function finish(err, data) {
    if (err) return handleError(res, err)
    services.song.publish(
        events.SONG_CREATED,
        data
      )
    return res.status(200).json(data)
  }

  db.getSongRequestWithSpotifyID(req.params.spotifyID)
    .then(songRequest => {
      var song = Song.newFromSpotifyInfo(songRequest.spotify_info)
      song.key = req.body.key
      song.save((err) => {
        if (err) return finish(err)
        db.updateSongRequestWithID(songRequest.id, { status: status.COMPLETED,
                                                     completed: new Date() })
          .then(() => finish(null, { song: song,
                                     songRequest: songRequest,
                                     completionMS: (new Date() - songRequest.created_at)/1000 }))
          .catch(err => finish(err))
      })
    })
    .catch(err => finish(err))
}

function getSpotifyIDs(req, res, next) {
  Song.getSpotifyIDs()
  .then(ids => res.status(200).json({ spotifyIDs: ids }))
  .catch(err => res.status(500).json(err))
}

router.get('/getSpotifyIDs', getSpotifyIDs)
router.post('/complete/:spotifyID', checkBucket, checkForSong, completeSongAcquisition)
router.post('/:spotifyID', checkForSong, checkForSongRequest, initiateAcquisition)


function handleError(res, err) {
  console.log(err);
  return res.status(err.statusCode).json({ message: err.message })
}


module.exports = router
