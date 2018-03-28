exports.up = function(pgm) {
  pgm.addConstraint('song_requests', 'unique_spotify_id', 'UNIQUE (spotify_id)')
};

exports.down = function(pgm) {

};
