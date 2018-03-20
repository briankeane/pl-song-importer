const errors = require('../errors')
const utils = require('../../deps/db-utils')

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
    utils.create(db, defaults, data, SONG_REQUESTS_PUBLIC_COLUMNS, SONG_REQUESTS_TABLE)
      .then(course => resolve(course))
      .catch(error => {
        if (error.constraint === 'courses_transcript_id_unique_index') {
          reject(new Error(errors.COURSE_ALREADY_EXISTS_WITH_TRANSCRIPT_ID))
        } else if (parseInt(error.code) === 23502) {
          reject(new Error(errors.TRANSCRIPT_ID_INVALID))
        } else {
          reject(error)
        }
      })
  })
}

function updateWithID(db, songRequestID, data = {}) {
  return new Promise((resolve, reject) => {
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
    utils.updateWithID(db, songRequestID, allowedFields, data, SONG_REQUESTS_PUBLIC_COLUMNS, SONG_REQUESTS_TABLE)
      .then(segment => resolve(segment))
      .catch(error => {
        // if (error.constraint === 'courses_transcript_id_unique_index') {
        //   reject(new Error(errors.COURSE_ALREADY_EXISTS_WITH_TRANSCRIPT_ID))
        // } else if (parseInt(error.code) === 23502) {
        //   reject(new Error(errors.TRANSCRIPT_ID_INVALID))
        // } else {
          reject(error)
        // }
      })
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