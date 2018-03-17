const lib = require('./lib')

function onSpotifyInfoReceived(data) {
  console.log('spotifyInfoReceived')
  console.log(data)
}

function onSpotifyInfoFailed(data) {
  console.log('onSpotifyInfoFailed')
  console.log(data)
}

function onYouTubeIDsAdded(data) {
  console.log('onYouTubeIDsAdded')
  console.log(data)
}

module.exports = {
  onSpotifyInfoReceived,
  onSpotifyInfoFailed,
  onYouTubeIDsAdded
}