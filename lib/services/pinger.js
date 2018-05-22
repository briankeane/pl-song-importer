const spotify = require('./spotify')
const youTube = require('./youTube')
const youTubeAudioProcessor = require('./youTubeAudioProcessor')
const { httpErrorFromAPIError } = require('./utils')

const ping = (api) => {
  return new Promise((resolve, reject) => {
    console.log('pinging: ')
    api.get('/v1/ping')
      .then(res => resolve('succeeded'))
      .catch(err => resolve('failed'))
  })
}

const pingAll = () => {
  return new Promise((resolve, reject) => {
    Promise.all([
      ping(youTube.api),
      ping(spotify.api)
    ])
      .then((results) => resolve({
        youTube: results[0],
        spotify: results[1]
      }))
      .catch(err => reject(err))
  })
}

module.exports = {
  spotify,
  youTube,
  youTubeAudioProcessor,
  pingAll
}