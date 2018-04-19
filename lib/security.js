const jwt = require('express-jwt')({secret: process.env.JWT_SECRET})

function validateToken(req, authOrSecDef, scopesOrApiKey, next) {
  if (process.env.API_TOKEN === scopesOrApiKey) {
    req.api_token = scopesOrApiKey
    return next(null);
  } else {
    let error = new Error('Invalid credentials')
    error.code = "api_key"
    error.statusCode = 401
    return next(error);
  }
}

function validateJwt(req, authOrSecDef, scopesOrApiKey, next) {
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