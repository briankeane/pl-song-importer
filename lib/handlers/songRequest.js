const lib = require('../lib')
const db = require('../db')
const status = require('../status')
const services = require('../services')
const events = require('../events')

function onSpotifyInfoReceived(songRequest) {
  db.updateSongRequestWithID(songRequest.id, { spotify_info: songRequest.spotify_info,
                                               status: status.GETTING_YOUTUBE_MATCHES })
    .then(() => {})
    .catch(err => console.log(err))
}

function onSpotifyInfoFailed(err) {
  console.log('onSpotifyInfoFailed')
  console.log(err)

  // db.updateSongRequestWithID(songRequest.id, { spotify_info_err: err,
  //                                             status: status.FAILED_TO_GET_SPOTIFY_INFO })
  //   .then(() => {})
  //   .catch(err => console.log(err))
}

function onYouTubeInfoReceived(songRequest) {
  db.updateSongRequestWithID(songRequest.id, { youtube_matches: JSON.stringify(songRequest.youtube_matches),
                                              status: status.DOWNLOADING_AUDIO,
                                              is_processing: true })
    .then(beginAudioDownload)
    .catch(err => console.log(err))
}

function onYouTubeInfoFailed(songRequest) {
  db.updateSongRequestWithID(songRequest.id, { youtube_matches_error: songRequest.youtube_matches_error,
                                              status: status.FAILED_TO_GET_YOUTUBE_MATCHES,
                                              is_processing: false })
    .then(() => {})
    .catch(err => console.log(err))
}

function beginAudioDownload(songRequest) {
  function handleErr(err) {
    db.updateSongRequestWithID(songRequest.id, { audio_download_error: err,
                                                 status: status.DOWNLOADING_AUDIO,
                                                 is_processing: true })
      .then(() => {})
      .catch(err => console.log(err))
  }

  const youTubeIDs = songRequest.youtube_matches.map(match => match.id)
  lib.requestAudioForSongRequest({ youTubeIDs: youTubeIDs, spotifyID: songRequest.spotify_id })
    .then(lib.scheduleAudioDownloadCheck)
    .catch(err => handleErr(err))
}

function subscribe() {
  services.songRequest.subscribe(events.SONGREQUEST_SPOTIFYINFO_RECEIVED, onSpotifyInfoReceived)
  services.songRequest.subscribe(events.SONGREQUEST_SPOTIFYINFO_FAILED, onSpotifyInfoFailed)
  services.songRequest.subscribe(events.SONGREQUEST_YOUTUBEINFO_RECEIVED, onYouTubeInfoReceived)
  services.songRequest.subscribe(events.SONGREQUEST_YOUTUBEINFO_FAILED, onYouTubeInfoFailed)
}

module.exports = {
  subscribe
}