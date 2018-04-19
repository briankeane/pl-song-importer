const song = require('./song')
const songRequest = require('./songRequest')

const subscribeAll = () => {
  song.subscribe()
  songRequest.subscribe()
}

module.exports = {
  subscribeAll
}