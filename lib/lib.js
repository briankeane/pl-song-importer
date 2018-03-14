const spotify = require('./services/spotify')
const Song = require('./mongoose/song.model')
const AWS = require('aws-sdk')

const LAMBDA_FUNCTION_TO_DISPATCH = 'youtube-converter'

function hello() {
    return new Promise((resolve, reject) => {
        resolve('world')
    })
}

function youTubeSearchDataFromSpotifyInfo(spotifyInfo) {
  return {
    artist: spotifyInfo["artists"][0]["name"],
    title: spotifyInfo["name"],
    duration: spotifyInfo["duration_ms"]
  }
}

function requestAudio({ 
  youTubeIDs, 
  spotifyID
}) {
  return new Promise((resolve, reject) => {
    var lambda = new AWS.Lambda()
    lambda.invoke({
      FunctionName: LAMBDA_FUNCTION_TO_DISPATCH,
      Payload: JSON.stringify({ youTubeIDs: youTubeIDs,
                                webHookURL: `${process.env.BASE_URL}/v1/songRequests/complete/${spotifyID}`,
                                bucketName: process.env.SONGS_BUCKET_NAME
                              }),
      InvocationType: 'Event'
    }, function (err, response) {
      if (err) {
        console.log('LABMDA ERROR!', err)
      }
      if (response['StatusCode'] !== 202) {
        reject(response)
      } else {
        resolve(response)
      }
    })
  })
}


module.exports = { 
  hello,
  youTubeSearchDataFromSpotifyInfo,
  requestAudio
}
