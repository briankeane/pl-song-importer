const pgp = require('pg-promise')()
const db = pgp(process.env.DATABASE_URL)
const songRequests = require('./songRequests')
const errors = require('../errors')
const utils = require('../../deps/db-utils')

module.exports = {
  //
  // Song Requests
  //
  createSongRequest: (data) => {
    if (data.spotify_info) {
      data.spotify_id = data.spotify_info.id
    }
    return songRequests.create(db, data)
  },
  getAllSongRequests: () => {
    return utils.getMany(db, songRequests.columns, songRequests.table, 'id')
  },
  getSongRequestWithID: (songRequestID) => {
    return utils.getWithID(db, songRequestID, songRequests.columns, songRequests.table, errors.SONG_REQUEST_DOES_NOT_EXIST)
  },
  getSongRequestWithIDs: (songRequestIDs) => {
    return utils.getWithID(db, songRequestIDs, songRequests.columns, songRequests.table)
  },
  removeSongRequestWithID: (songRequestID) => {
    return utils.removeWithID(db, songRequestID, songRequests.table, errors.SONG_REQUEST_DOES_NOT_EXIST)
  },
  updateSongRequestWithID: (songRequestID, data) => {
    return songRequests.updateWithID(db, songRequestID, data)
  },
  getSongRequestWithSpotifyID: (spotifyID) => {
    return utils.getWithFieldID(db, spotifyID, 'spotify_id', songRequests.columns, songRequests.table, errors.SONG_REQUEST_DOES_NOT_EXIST)
  },
  removeSongRequestWithSpotifyID: (spotifyID) => {
    return utils.removeWithFieldID(db, spotifyID, 'spotify_id', songRequests.table, errors.SONG_REQUEST_DOES_NOT_EXIST)
  },
  getSongRequestsMatchingQuery: (query) => {
    return db.manyOrNone(`select ${songRequests.columns} from ${songRequests.table} ` +
      'where (spotify_id) ilike ${query} ' +
      'or status ilike ${query} ' +
      // 'or song_id ilike ${query} ' +
      // 'or is_processing ilike ${query} ' +
      `limit 10`, { query: `%${query}%` })
  }
}