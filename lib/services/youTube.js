const axios = require('axios')
const api = axios.create({
  baseURL: process.env.SERVICE_BASE_URL_YOUTUBE,
  headers: {
    Authorization: process.env.SERVICE_API_TOKEN_YOUTUBE,
    'content-type': 'application/json'
  }
})
const { httpErrorFromAPIError } = require('./utils')

function getMatches(attrs) {
  return new Promise((resolve, reject) => {
    api.get('/matches', { params: attrs })
      .then(res => resolve(res.data.matches))
      .catch(err => reject(httpErrorFromAPIError(err)))
  })
}

module.exports = {
  getMatches
}