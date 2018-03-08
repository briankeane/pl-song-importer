let amqp = require('amqplib/callback_api')

class EventStream {

  constructor(name, url) {
    this.name = name
    this.url = url
    this.channel = null
    this.queue = null
  }

  connect() {
    return new Promise((resolve, reject) => {
      const createChannel = (connection) => {
        this._createChannel(connection)
          .then(() => createQueue())
          .catch(error => reject(error))
      }

      const createQueue = () => {
        this._createQueue()
          .then(() => resolve())
          .catch(error => reject(error))
      }

      amqp.connect(
        this.url,
        (error, connection) => {
          if (error) {
            reject(error)
          } else {
            createChannel(connection)
          }
        })
    })
  }

  _createChannel(connection) {
    return new Promise((resolve, reject) => {
      connection.createChannel(
        (error, channel) => {
          if (error) {
            reject(error)
          } else {
            this.channel = channel
            resolve()
          }
        })
    })
  }

  _createQueue() {
    return new Promise((resolve, reject) => {
      this.channel.assertQueue(
        '',
        {exclusive: true},
        (error, queue) => {
          if (error) {
            reject(error)
          } else {
            this.queue = queue
            resolve()
          }
        })
    })
  }

  publish(event, data) {
    this.channel.assertExchange(event, 'fanout', {durable: false})
    this.channel.publish(event, '', new Buffer(JSON.stringify(data)))
  }

  subscribe(event, handler) {
    this.channel.assertExchange(event, 'fanout', {durable: false})
    this.channel.bindQueue(this.queue.queue, event, '')
    this.channel.consume(this.queue.queue, handler)
  }

}

module.exports = EventStream