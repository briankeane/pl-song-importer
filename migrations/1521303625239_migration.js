exports.up = function(pgm) {
  pgm.addColumns('song_requests', 
    {
      'spotify_info_error' : {type: 'jsonb'},
      'youtube_matches_error' : {type: 'jsonb'},
      'youtube_matches' : {type: 'jsonb[]'},
      'key' : {type: 'string'},
      'download_error' : {type: 'jsonb'}
    }
  )
};

exports.down = function(pgm) {

};
