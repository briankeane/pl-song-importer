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

function ping() {
  return new Promise((resolve, reject) => {
    api.get('/ping')
      .then(res => resolve(res.data))
      .catch(err => reject(httpFromAPIError(err)))
  })
}

module.exports = {
  getMatches,
  api
}