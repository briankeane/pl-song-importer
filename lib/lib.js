const spotify = require('./services/spotify')
const Song = require('./mongoose/song')
const AWS = require('aws-sdk')
const services = require('./services')
const events = require('./events')
const db = require('./db')
const errors = require('./errors')
const status = require('./status')

const youTubeAudioProcessor = require('./services/youTubeAudioProcessor')

function getOrCreateSongRequest(spotifyID) {
  return new Promise((resolve, reject) => {
    if (!spotifyID) return reject(new Error('spotifyID not included'))
    // first search songRequest
    db.getSongRequestWithSpotifyID(spotifyID)
      .then(songRequest => {
        if (songRequest.song_id) {
          Song.findById(songRequest.song_id)
            .then(song => resolve({ ...songRequest, song: song.toObject() }))
            .catch(err => reject(err))
        } else {
          resolve(songRequest)
        }
      })
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
            db.createSongRequest({ spotify_id: spotifyID, status: status.COMPLETED, is_processing: false, song_id: song.id })
              .then(createdRequest => resolve({ ...createdRequest, song })) 
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
      console.log('publishing SONGREQUEST_CREATED event: ', events.SONGREQUEST_CREATED)
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

function requestAudioForSongRequest({ youTubeIDs, spotifyID }) {
  console.log('requestingAudioForSongRequest: ', spotifyID)
  return new Promise((resolve, reject) => {
    const webHookURL = `${process.env.BASE_URL}/v1/songRequests/complete/${spotifyID}`
    const webHookAPIToken = process.env.API_TOKEN
    youTubeAudioProcessor.requestAudio({ youTubeIDs, spotifyID, webHookURL, webHookAPIToken })
      .then(() => { 
        scheduleAudioDownloadCheck({ spotifyID })
        resolve()
      })
      .catch(err => reject(err))
  })
}

function requestReplacementAudioForSong({ youTubeID, songID }) {
  const webHookURL = `${process.env.BASE_URL}/v1/songs/${songID}/replaceAudio`
  return youTubeAudioProcessor.requestAudio({ webHookURL, youTubeIDs: [youTubeID] })
}

function completeReplaceAudioForSong({ key, songID }) {
  return new Promise((resolve, reject) => {
    Song.findOneAndUpdate({ _id: songID }, { $set: { key } },{ new: true })
      .then(updatedSong => resolve(updatedSong))
      .catch(err => reject(err))
  })
}

// waits and marks the status as AUDIO_DOWNLOAD_TIMED_OUT if it has not
// returned after waitTimeMS
function scheduleAudioDownloadCheck({ spotifyID, waitTimeMS }) {
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
}

function completeSongAcquisition({ spotifyID, key }) {
  return new Promise((resolve, reject) => {
    function finish(err, data) {
      if (err) { 
        console.log(err)
       return reject(err)
      }
      services.song.publish(
        events.SONG_CREATED,
        data
      )
      return resolve(data)
    }

    db.getSongRequestWithSpotifyID(spotifyID)
      .then(songRequest => {
        // IF a song already exists, just updated the
        // key -- this is to avoid duplicates in race condition
        Song.findOne({ 'spotifyInfo.id': spotifyID })
            .then(foundSong => {
              if (foundSong) {
                foundSong.key = key
                Promise.all([db.updateSongRequestWithID(songRequest.id, { song_id: foundSong.id }),
                             foundSong.save() ])
                  .then((results) => resolve({ ...results[0], 
                                               ...{ song: foundSong }
                                            })
                  )
                  .catch(err => reject(err))
              } else {
                var song = Song.newFromSpotifyInfo(songRequest.spotify_info)
                console.log('completing Song Acquisition for: ', song.title)
                song.key = key
                song.save((err) => {
                  if (err) return finish(err)
                  db.updateSongRequestWithID(songRequest.id, { status: status.COMPLETED,
                                                               completed: 'now()',
                                                               song_id: song.id,
                                                               is_processing: false })
                    .then((savedSongRequest) => finish(null, song))
                    .catch(err => finish(err))
                })
              }
            })
            .catch(err => finish(err))
      })
      .catch(err => finish(err))
  })
}

function getSongRequestsMatchingQueryString(queryString) {
  // allow statuses to be queried by their KEY
  if (Object.keys(status).includes(queryString)) {
    queryString = status[queryString]
  }
  return db.getSongRequestsMatchingQuery(queryString)
}

function removeSongRequestMatchingSpotifyID(spotifyID) {
  return db.removeSongRequestWithSpotifyID(spotifyID)
}

module.exports = { 
  getOrCreateSongRequest,
  createSongRequest,
  requestAudioForSongRequest,
  requestReplacementAudioForSong,
  completeReplaceAudioForSong,
  completeSongAcquisition,
  getSongRequestsMatchingQueryString,
  removeSongRequestMatchingSpotifyID
}
