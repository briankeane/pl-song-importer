const pinger = require('../../lib/services/pinger')

function ping (req, res, next) {
  return res.status(200).send({ message: 'pong' })
}

function pingAllServices (req, res, next) {
  console.log('pinging all')
  pinger.pingAll()
    .then(result => res.status(200).send(result))
    .catch(err => res.status(500).send(err))
}

module.exports = {
  ping,
  pingAllServices
}