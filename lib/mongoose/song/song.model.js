'use strict';

const AudioBlockSchema  =     require('./audioBlock.schema');
const AudioBlock        =     require('./audioBlock.model');

const mongoose          =     require('mongoose');
const Schema            =     mongoose.Schema;
const _                 =     require ('lodash');

var songSchema = new AudioBlockSchema({
  originalTags:           {},
  artist:                 { type: String  },
  artistID:               { type: Schema.ObjectId, ref: 'Artist' },
  title:                  { type: String  },
  album:                  { type: String  },
  albumArtworkUrl:        { type: String  },
  albumArtworkUrlSmall:   { type: String  },
  trackViewUrl:           { type: String  },
  _eoi:                   { type: Number  },
  _eom:                   { type: Number  },
  _boo:                   { type: Number  },
  itunesTrackID:          { type: String  },
  spotifyID:              { type: String  },
  spotifyInfo:            {},
  itunesInfo:             {},
  verified:               { type: Boolean },
  explicit:               { type: Boolean },
  isrc:                   { type: String  }
}, {
  toObject: {
    virtuals: true,
    transform: function (doc, ret, options) {
      return {
        id: ret.id,
        key: ret.key,
        isrc: ret.isrc,
        duration: ret.duration,
         __t: ret.__t,
        artist: ret.artist,
        title: ret.title,
        album: ret.album,
        itunesTrackID: ret.itunesTrackID,
        albumArtworkUrl: ret.albumArtworkUrl,
        albumArtworkUrlSmall: ret.albumArtworkUrlSmall,
        trackViewUrl: ret.trackViewUrl,
        eoi: ret.eoi,
        eom: ret.eom,
        boo: ret.boo,
        audioFileUrl: ret.audioFileUrl,
        lastFMTags: ret.lastFMTags,
        status: ret.status,
        spotifyInfo: ret.spotifyInfo,
        spotifyID: ret.spotifyID
      }
    }
  },
  toJSON: {
    virtuals: true
  }
})

songSchema.statics.newFromSpotifyInfo = function (spotifyInfo) {
  // validation
  if (!spotifyInfo["artists"] || !spotifyInfo["artists"].length) {
    throw new Error('no artists in spotifyInfo');
  }

  if (!spotifyInfo["album"]) {
    throw new Error('no album in spotifyInfo');
  }

  // creation
  var song = new Song();
  song.artist = spotifyInfo["artists"][0]["name"];
  song.title = spotifyInfo["name"];
  song.album = spotifyInfo["album"]["name"];
  song.duration = spotifyInfo["duration_ms"];
  song.spotifyID = spotifyInfo["id"]
  song.spotifyInfo = spotifyInfo;
  song.explicit = spotifyInfo.explicit;
  if (spotifyInfo["external_ids"]) {
    song.isrc = spotifyInfo["external_ids"]["isrc"];
  }
  if (spotifyInfo["album"] && spotifyInfo["album"]["images"] && spotifyInfo["album"]["images"].length) {
    song.albumArtworkUrl = spotifyInfo["album"]["images"][0]["url"];
  }
  return song;
}

// provide defaults for eom, eoi, boo
songSchema.virtual('eom')
  .get(function () {
    if (!this._eom) {
      return this.duration - 1000;
    } else {
      return this._eom;
    }
  })
  .set(function (value) {
    this._eom = value;
  })

songSchema.virtual('eoi')
  .get(function () {
    if (!this._eoi) {
      return 0;
    } else {
      return this._eoi;
    }
  })
  .set(function (value) {
    this._eoi = value;
  })

songSchema.virtual('boo')
  .get(function () {
    if (!this._boo) {
      return this.eom;
    } else {
      return this._boo;
    }
  })
  .set(function (value) {
    this._boo = value;
  })


songSchema.statics.getSpotifyIDs = function (limit=1000) {
  return new Promise((resolve, reject) => {
    Song
      .find({ 'spotifyInfo.id': { $exists: true }})
      .limit(limit)
      .exec(function (err, foundSongs) {
        if (err) return reject(err)
        return resolve(foundSongs.map(song => song.spotifyInfo.id))
      })
  })
}

const Song = AudioBlock.discriminator('Song', songSchema)
module.exports = Song
