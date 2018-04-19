'use strict'

const path = require('path')
const SwaggerExpress = require('swagger-express-mw')
const SwaggerUi = require('swagger-tools/middleware/swagger-ui')
const app = require('express')()
const bearerToken = require('express-bearer-token')
const compression = require('compression')
const handlers = require('./lib/handlers')
const services = require('./lib/services')
const security = require('./lib/security')
const mongoDB = require('./lib/mongoose')
const port = process.env.PORT || 5000

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization')
  if ('OPTIONS' === req.method) {
    res.status(200).end()
  } else {
    next()
  }
})

app.use(bearerToken())
app.use(compression())

const config = {
  appRoot: __dirname,
  swaggerSecurityHandlers: security.handlers
}

function connectToServicesWithRetry() {
  return new Promise((resolve, reject) => {
    services.connect().then(() => {
      console.log('connected to amqlib')

      // set max prefetch to avoid overloading heroku memory
      for (let service of services.streams) {
        service.channel.prefetch(50)
      }
      resolve()
    })
    .catch(error => {
      console.log('error connecting to services.  retrying after 1 sec')
      setTimeout(connectToServicesWithRetry, 1000)
    })
  })
}

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err }

  app.use(SwaggerUi(swaggerExpress.runner.swagger))

  // install middleware
  swaggerExpress.register(app)

  app.listen(port)
  console.log(`Listening on port ${port}`)

  Promise.all([ 
    mongoDB.connect(), 
    connectToServicesWithRetry()
  ])
    .then(() => {
      handlers.subscribeAll()
    })
    .catch(err => console.log(err))

    app.get('/', (req, res) => {
      res.sendFile(path.join(`${config.appRoot}/views/docs.html`))
    })

    app.get('/swagger.yaml', (req, res) => {
      res.sendFile(path.join(`${config.appRoot}/api/swagger/swagger.yaml`))
    })
})

// explicitly log stack trace for unhandled rejections
process.on('unhandledRejection', (err, p) => {
  console.log(err)
})
