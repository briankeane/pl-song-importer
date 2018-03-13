const axios = require('axios')
const api = axios.create({
  baseURL: process.env.SERVICE_BASE_URL_SPOTIFY_INTERFACE
})
const { httpErrorFromAPIError } = require('./utils')

function getSongWithID(spotifyID) {
  return new Promise((resolve, reject) => {
    api.get(`/songs/${spotifyID}`)
      .then(res => resolve(res.data))
      .catch(err => reject(httpErrorFromAPIError(err)))
  })
}

module.exports = {
  getSongWithID
}