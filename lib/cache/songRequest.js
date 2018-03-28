const url = require('url')
const client = require('./redisClient')

class SongRequestCache {
  constructor() {

  }

  show (req, res, next) {
    client.get(`song_request_${req.params.spotifyID}`, (err, data) => {
      if (err) {
        console.log(err)
        next()
      }

      if (data) {
        return res.status(200).send(data)
      } else {
        next()
      }
    })
  }

  setSongRequest(songRequest) {
    client.setex(`song_request_${songRequest.spotify_id}`, 60, JSON.stringify(songRequest))
  }
}

module.exports = new SongRequestCache()