'use strict';

var util = require('util');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

function AudioBlockSchema() {
  Schema.apply(this, arguments);

  this.add({
    type:               { type: String },
    key:                { type: String },
    duration:           { type: Number }
  });


}
util.inherits(AudioBlockSchema, Schema);

module.exports = AudioBlockSchema