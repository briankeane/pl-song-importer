exports.up = function(pgm) {
  pgm.addColumns('song_requests', { 'completed' : {type: 'datetime', default: null} })
};

exports.down = function(pgm) {

};
