const spotify = require('./services/spotify')
const Song = require('./mongoose/song.model')
const AWS = require('aws-sdk')
const services = require('./services')
const events = require('./events')
const db = require('./db')
const errors = require('./errors')
const status = require('./status')

const LAMBDA_FUNCTION_TO_DISPATCH = 'youtube-converter'

function youTubeSearchDataFromSpotifyInfo(spotifyInfo) {
  return {
    artist: spotifyInfo["artists"][0]["name"],
    title: spotifyInfo["name"],
    duration: spotifyInfo["duration_ms"]
  }
}

function getOrCreateSongRequest(spotifyID) {
  return new Promise((resolve, reject) => {
    // first search songRequest
    db.getSongRequestWithSpotifyID(spotifyID)
      .then(songRequest => resolve(songRequest))
      .catch(err => {
        if (err.message !== errors.SONG_REQUEST_DOES_NOT_EXIST) return reject(err)
        // check if song already exists
        Song.findOne({ 'spotifyInfo.id': spotifyID }, function (err, song) {
          if (err) {
            console.log(err)
            return reject(err)
          }
          // IF the song already exists, create a completed songRequest with it
          // and resolve with it
          if (song) {
            db.createSongRequest({ spotify_id: spotifyID, status: status.COMPLETED, is_processing: false, song: song })
              .then(createdRequest => resolve({ song: song, 
                                                ...createdRequest }))
              .catch(err => reject(err))
          } else {
            createSongRequest(spotifyID)
              .then(newRequest => resolve(newRequest))
              .catch(err => reject(err))
          }
        })
      })
  })
}

function createSongRequest(spotifyID) {
  return new Promise((resolve, reject) => {
    function finish(songRequest) {
      services.songRequest.publish(
          events.SONGREQUEST_CREATED,
          songRequest
        )
      resolve(songRequest)
    }

    db.createSongRequest({ spotify_id: spotifyID, status: status.GETTING_SPOTIFY_INFO, is_processing: true })
      .then(createdRequest => finish(createdRequest))
      .catch(err => reject(err))
  })
}


function requestAudio({ youTubeIDs, spotifyID }) {
  return new Promise((resolve, reject) => {
    var lambda = new AWS.Lambda()
    lambda.invoke({
      FunctionName: LAMBDA_FUNCTION_TO_DISPATCH,
      Payload: JSON.stringify({ youTubeIDs: youTubeIDs,
                                webHookURL: `${process.env.BASE_URL}/v1/songRequests/complete/${spotifyID}`,
                                bucketName: process.env.SONGS_BUCKET_NAME
                              }),
      InvocationType: 'Event'
    }, function (err, response) {
      if (err) {
        console.log('LABMDA ERROR!', err)
        return reject(err)
      }
      if (response['StatusCode'] !== 202) {
        reject(response)
      } else {
        resolve({ spotifyID: spotifyID })
      }
    })
  })
}

// waits and marks the status as AUDIO_DOWNLOAD_TIMED_OUT if it has not
// returned after waitTimeMS
function scheduleAudioDownloadCheck({ spotifyID, waitTimeMS }) {
  return new Promise((resolve, reject) => {
    var waitTimeMS = waitTimeMS || 1000*60    // default 1 min
    setTimeout(() => {
      db.getSongRequestWithSpotifyID(spotifyID)
        .then(songRequest => {
          if (songRequest.status == status.DOWNLOADING_AUDIO) {
            db.updateSongRequestWithID(songRequest.id, { status: status.AUDIO_DOWNLOAD_TIMED_OUT,
                                                         is_processing: false })
              .catch(err => console.log(err))
          }
        })
    }, waitTimeMS)
  })
}

function completeSongAcquisition({ spotifyID, key }) {
  return new Promise((resolve, reject) => {
    function finish(err, data) {
      if (err) return reject(err)
      services.song.publish(
          events.SONG_CREATED,
          data
        )
      return resolve(data)
    }

    db.getSongRequestWithSpotifyID(spotifyID)
      .then(songRequest => {
        // IF the song request has already been processed,
        // populate the existing songRequest and resolve with it
        if (songRequest.song_id) {
          Song.findById(songRequest.song_id)
            .exec((err, foundSong) => {
              resolve({ song: song,
                        ...savedSongRequest })
            })
        } else {
          var song = Song.newFromSpotifyInfo(songRequest.spotify_info)
          song.key = key
          song.save((err) => {
            if (err) return finish(err)
            db.updateSongRequestWithID(songRequest.id, { status: status.COMPLETED,
                                                         completed: 'now()',
                                                         song_id: song.id,
                                                         is_processing: false })
              .then((savedSongRequest) => finish(null, { song: song,
                                                         ...savedSongRequest }))
              .catch(err => finish(err))
          })
        }
      })
      .catch(err => finish(err))
  })
}

module.exports = { 
  youTubeSearchDataFromSpotifyInfo,
  requestAudio,
  createSongRequest,
  completeSongAcquisition,
  getOrCreateSongRequest
}
