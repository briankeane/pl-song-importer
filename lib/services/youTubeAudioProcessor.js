const AWS = require('aws-sdk')

const LAMBDA_FUNCTION_TO_DISPATCH = 'youtube-converter'

function requestAudio({ youTubeIDs, webHookURL }) {
  return new Promise((resolve, reject) => {
    var lambda = new AWS.Lambda()
    lambda.invoke({
      FunctionName: LAMBDA_FUNCTION_TO_DISPATCH,
      Payload: JSON.stringify({ youTubeIDs: youTubeIDs,
                                webHookURL: webHookURL,
                                bucketName: process.env.SONGS_BUCKET_NAME
                              }),
      InvocationType: 'Event'
    }, function (err, response) {
      if (err) {
        console.log('LABMDA ERROR!', err)
        return reject(err)
      }
      if (response['StatusCode'] !== 202) {
        reject(response)
      } else {
        resolve({ spotifyID: spotifyID })
      }
    })
  })
}

module.exports = {
  requestAudio
}