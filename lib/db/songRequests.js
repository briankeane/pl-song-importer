const errors = require('../errors')
const utils = require('../../deps/db-utils')
const songRequestCache = require('../cache/songRequest')

const SONG_REQUESTS_TABLE = 'song_requests'
const SONG_REQUESTS_PUBLIC_COLUMNS = [
  'id',
  'spotify_id',
  'spotify_info',
  'spotify_info_error',
  'youtube_matches',
  'youtube_matches_error',
  'key',
  'download_error',
  'status',
  'song_id',
  'is_processing',
  'completed',
  'created_at'
].map(c => `${SONG_REQUESTS_TABLE}.${c}`).join(', ')

function create(db, data = {}) {
  const defaults = {
    'spotify_id': '',
    'spotify_info': {},
    'spotify_info_error': {},
    'youtube_matches': {},
    'youtube_matches_error': {},
    'key': '',
    'download_error': {},
    'status': '',
    'song_id': '',
    'is_processing': true
  }
  return new Promise((resolve, reject) => {
    function finish(err, songRequest) {
      if (err) {
        if (err.constraint === 'spotify_id_unique_index') {
          return reject(new Error(errs.SONG_REQUEST_ALREADY_EXISTS))
        } else if (parseInt(err.code) === 23502) {
          return reject(new Error(errs.TRANSCRIPT_ID_INVALID))
        }
        return reject(err)
      } else {
        songRequestCache.setSongRequest(songRequest)
        return resolve(songRequest)
      }
    }

    utils.create(db, defaults, data, SONG_REQUESTS_PUBLIC_COLUMNS, SONG_REQUESTS_TABLE)
      .then(songRequest => finish(null, songRequest))
      .catch(err => finish(err))
  })
}

function updateWithID(db, songRequestID, data = {}) {
  const allowedFields = [
    'id',
    'spotify_id',
    'spotify_info',
    'spotify_info_error',
    'youtube_matches',
    'youtube_matches_error',
    'key',
    'download_error',
    'status',
    'song_id',
    'is_processing',
    'completed',
    'created_at'
  ]

  return new Promise((resolve, reject) => {
    function finish(err, songRequest) {
      if (err) {
        console.log(err)
        return reject(err)
      }
      songRequestCache.setSongRequest(songRequest)
      resolve(songRequest)
    }
    
    utils.updateWithID(db, songRequestID, allowedFields, data, SONG_REQUESTS_PUBLIC_COLUMNS, SONG_REQUESTS_TABLE)
      .then(segment => finish(null, segment))
      .catch(err => finish(err))
  })
}

module.exports = {
  //
  // Constants
  //
  columns: SONG_REQUESTS_PUBLIC_COLUMNS,
  table: SONG_REQUESTS_TABLE,

  //
  // Methods
  //
  create,
  updateWithID
}