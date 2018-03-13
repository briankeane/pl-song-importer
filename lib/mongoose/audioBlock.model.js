'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var AudioBlockSchema = require('./audioBlock.schema');
var timestamps = require('mongoose-timestamp');
var ModelSchema = new AudioBlockSchema({ __t: { type: String, index: true },
                                        _type: { type: String } },
  { collection: 'audioBlocks' }
);

ModelSchema.plugin(timestamps);

ModelSchema.index({"__t": 1, "_id": 1});

module.exports = mongoose.model('AudioBlock', ModelSchema);