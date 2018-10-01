const axios = require('axios')
const api = axios.create({
  baseURL: process.env.SERVICE_BASE_URL_SPOTIFY,
  headers: {
    Authorization: process.env.SERVICE_API_TOKEN_SPOTIFY,
    'content-type': 'application/json'
  }
})

module.exports = {
  api
}