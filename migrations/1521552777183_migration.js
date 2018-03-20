exports.up = function(pgm) {
  pgm.addColumns('song_requests', { 'song_id' : 'string' })
};

exports.down = function(pgm) {

};
