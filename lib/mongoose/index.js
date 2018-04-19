const mongoose = require('mongoose')

//
// connect
//
function connect () {
  return new Promise((resolve, reject) => {
    mongoose.connect(process.env.MONGODB_URI, { autoReconnect: true }, function (err) {
      if (err) {
        return reject(err)
      }
      console.log('mongoose connected!')
      resolve()
    })

    //
    // Retry until success
    //
    mongoose.connection.on('error', function(err) {
      console.error(`Retrying mongodb in 1 sec. connection error: ${err}`);
      setTimeout(() => {
        connect()
          .then(resolve())
        }, 1000)
    })
  })
}

module.exports = {
  connect
}