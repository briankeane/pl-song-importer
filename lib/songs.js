const Song = require('./mongoose/song')

function getByIDs(songIDs) {
  return Song.find({ _id: songIDs })
}

module.exports = {
  getByIDs
}