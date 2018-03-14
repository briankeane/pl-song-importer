const HttpError = require('../models/HttpError')

function httpErrorFromAPIError(error) {
  const res = error.response
  return new HttpError(res.status, res.data.message)
}

module.exports = {
  httpErrorFromAPIError
}