const jwt = require('express-jwt')({secret: process.env.JWT_SECRET})

function validateToken(req, authOrSecDef, scopesOrApiKey, next) {
  console.log('scopesOrApiKey: ', scopesOrApiKey)
  console.log('req.api_token ', req.api_token)
  const apiToken = scopesOrApiKey || req.api_token || req.headers.authorization
  if (process.env.API_TOKEN === apiToken) {
    req.api_token = apiToken
    return next(null);
  } else {
    let error = new Error('Invalid credentials')
    error.code = "api_key"
    error.statusCode = 401
    return next(error);
  }
}

function validateJwt(req, authOrSecDef, scopesOrApiKey, next) {
  console.log('here')
  jwt(req, req.res, (err) => {
    if (req.user) {
      return next(null)
    }
    else {
      let error = new Error('Invalid credentials')
      error.code = "jwt"
      err.statusCode = 401
      return next(err)
    }
  })
}

const handlers = {
  api_key: validateToken,
  jwt_key: validateJwt
}

module.exports = {
  handlers
}