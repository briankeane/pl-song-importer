const lib = require('./lib')
const db = require('./db')
const status = require('./status')

function onSpotifyInfoReceived(songRequest) {
  db.updateSongRequestWithID(songRequest.id, { spotify_info: songRequest.spotify_info,
                                               status: status.GETTING_YOUTUBE_MATCHES })
    .then(() => {})
    .catch(err => console.log(err))
}

function onSpotifyInfoFailed(err) {
  db.updateSongRequestWithID(songRequest.id, { spotify_info_err: err,
                                              status: status.FAILED_TO_GET_SPOTIFY_INFO })
    .then(() => {})
    .catch(err => console.log(err))
}

function onYouTubeInfoReceived(songRequest) {
  console.log('youtubeInfo received')
  console.log('youtubeInfo: ')
  console.log(songRequest.youtube_matches)
  db.updateSongRequestWithID(songRequest.id, { youtube_matches: JSON.parse(songRequest.youtube_matches),
                                              status: status.DOWNLOADING_AUDIO })
    .then((savedRequest) => beginAudioDownload(savedRequest))
    .catch(err => console.log(err))
}

function onYouTubeInfoFailed(songRequest) {
  db.updateSongRequestWithID(songRequest.id, { youtube_matches_error: songRequest.youtube_matches_error,
                                              status: status.FAILED_TO_GET_YOUTUBE_MATCHES })
    .then(() => {})
    .catch(err => console.log(err))
}

function beginAudioDownload(songRequest) {
  function handleErr(err) {
    db.updateSongRequestWithID(songRequest.id, { audio_download_error: err,
                                                 status: status.FAILED_TO_DOWNLOAD_AUDIO })
      .then(() => {})
      .catch(err => console.log(err))
  }

  const youTubeIDs = songRequest.youtube_matches.map(match => match.id)
  lib.requestAudio({ youTubeIDs: youTubeIDs, spotifyID: songRequest.spotify_id })
    .then(() => {})
    .catch(err => handleErr(err))
}

module.exports = {
  onSpotifyInfoReceived,
  onSpotifyInfoFailed,
  onYouTubeInfoReceived,
  onYouTubeInfoFailed
}