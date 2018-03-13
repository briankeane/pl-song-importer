exports.up = function(pgm) {
  pgm.createTable('song_requests', {
    id: {type: 'serial', primaryKey: true},
    status: 'string',
    spotify_id: 'string',
    spotify_info: 'jsonb',
    created_at: {type: 'datetime', default: 'now'}
  })
};

exports.down = function(pgm) {

};