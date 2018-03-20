exports.up = function(pgm) {
  pgm.addColumns('song_requests', { 'is_processing' : 'boolean' })
};

exports.down = function(pgm) {

};
