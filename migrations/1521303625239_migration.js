exports.up = function(pgm) {
  pgm.addColumns('song_requests', 
    {
      'spotify_info_error' : 
      {type: 'jsonb', default: false}
    },
    {
      'youtube_matches_error' : 
      {type: 'jsonb', default: false}
    },
    {
      'youtube_matches' :
      {type: 'jsonb[]', default: false}
    },
    {
      'key' :
      {type: 'string', default: false}
    },
    {
      'download_error' :
      {type: 'jsonb', default: false}
    }
  )
};

exports.down = function(pgm) {

};
