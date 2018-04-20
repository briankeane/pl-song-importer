const AWS = require('aws-sdk')

const LAMBDA_FUNCTION_TO_DISPATCH = 'youtube-converter'

function requestAudio({ youTubeIDs, spotifyID, webHookURL, webHookAPIKey }) {
  return new Promise((resolve, reject) => {
    var lambda = new AWS.Lambda()
    console.log(' calling lambda....................')
    lambda.invoke({
      FunctionName: LAMBDA_FUNCTION_TO_DISPATCH,
      Payload: JSON.stringify({ youTubeIDs: youTubeIDs,
                                webHookURL: webHookURL,
                                webHookAPIKey: webHookAPIKey,
                                bucketName: process.env.SONGS_BUCKET_NAME
                              }),
      InvocationType: 'Event'
    }, function (err, response) {
      if (err) {
        console.log('LABMDA ERROR!', err)
        return reject(err)
      }
      if (response['StatusCode'] !== 202) {
        console.log('statusCode wrong ---------------------------')
        console.log(response)
        reject(response)
      } else {
        console.log('LAMBDA SUCCESSFULLY CALLED ------------------------')
        resolve({ spotifyID: spotifyID })
      }
    })
  })
}

module.exports = {
  requestAudio
}