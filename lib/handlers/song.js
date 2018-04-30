const services = require('../services')
const events = require('../events')

function onSongCreated(data) {
  
}

function subscribe() {
  services.song.subscribe(events.SONG_CREATED, onSongCreated)
}

module.exports = {
  subscribe
}