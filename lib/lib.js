const spotify = require('./services/spotify')
const Song = require('./mongoose/song.model')
const AWS = require('aws-sdk')
const services = require('./services')
const events = require('./events')
const db = require('./db')
const status = require('./status')

const LAMBDA_FUNCTION_TO_DISPATCH = 'youtube-converter'

function youTubeSearchDataFromSpotifyInfo(spotifyInfo) {
  return {
    artist: spotifyInfo["artists"][0]["name"],
    title: spotifyInfo["name"],
    duration: spotifyInfo["duration_ms"]
  }
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


module.exports = { 
  youTubeSearchDataFromSpotifyInfo,
  requestAudio,
  createSongRequest
}
