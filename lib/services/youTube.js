const axios = require('axios')
const api = axios.create({
  baseURL: process.env.SERVICE_BASE_URL_YOUTUBE_SEARCH
})
const { httpErrorFromAPIError } = require('./utils')

function getMatches(attrs) {
  return new Promise((resolve, reject) => {
    api.get('/matches', { params: attrs })
      .then(res => { console.log('res', res); resolve(res.data.matches) })
      .catch(err => reject(httpErrorFromAPIError(err)))
  })
}

module.exports = {
  getMatches
}