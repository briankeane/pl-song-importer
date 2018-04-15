const { assert } = require('chai')
const faker = require('faker')
const mocha = require('mocha')
const after = mocha.after
const before = mocha.before
const beforeEach = mocha.beforeEach
const afterEach = mocha.afterEach
const describe = mocha.describe
const it = mocha.it
const sinon = require('sinon')
const mongoose = require('mongoose')

const db = require('../lib/db')
const services = require('../lib/services')
const lib = require('../lib/lib')
const errors = require('../lib/errors')
const status = require('../lib/status')
const events = require('../lib/events')
const Song = require('../lib/mongoose/song')

describe ('lib', function () {
  before(function (done) {
    console.log('MONGODB_URI: ', process.env.MONGODB_URI)
    mongoose.connect(process.env.MONGODB_URI, { autoReconnect: true }, (err) => {
      done()
    })
  })

  beforeEach(async function () {
    var requests = await db.getAllSongRequests()
    for (let request of requests) {
      await db.removeSongRequestWithID(request.id)
    }
    await Song.find({}).remove()
  })

  //
  // Stub for detecting services publishing
  //
  var createdSongRequest
  var publishStub
  // stub services
  beforeEach(function () {
    songRequestPublishStub = sinon.stub(services.songRequest, 'publish')
    songCreatedPublishStub = sinon.stub(services.song, 'publish')
  })

  afterEach(function () {
    songRequestPublishStub.restore()
    songCreatedPublishStub.restore()
  })

  afterEach(async function () {
    try {
      await db.removeSongRequestWithID(createdSongRequest.id)
    } catch (err) {}
  })

  //
  // dummy songRequest and song
  //
  var songRequest
  var song
  var spotifyInfo

  beforeEach(async function () {
    spotifyInfo = { id: 'aSpotifyID',
      artists: [{ name: 'bob' }],
      name: 'bobsSong',
      album: { name: 'bobsAlbum',
               images: [{ url: 'http://bobsPicURL.com' }] },
      duration_ms: 1000,
      explicit: true,
      external_ids: { isrc: 'bobsISRC' },
    }
    songRequest = await db.createSongRequest({ spotify_id: 'aSpotifyID',
                                               spotify_info: spotifyInfo,
                                               is_processing: true })
    song = await Song.create({ 'spotifyInfo': { id: 'anotherSpotifyID' } })
  })

  describe ('getOrCreateSongRequest', function () {

    it ('gets an existing songRequest', async function () {
      var createdSongRequest = await lib.getOrCreateSongRequest(songRequest.spotify_id)
      assert.equal(createdSongRequest.id, songRequest.id)
    })

    it ('song exists -- create a songRequest with proper song_id and status', async function () {
      var createdSongRequest = await lib.getOrCreateSongRequest(song.spotifyInfo.id)
      assert.equal(createdSongRequest.song_id, song.id)
      assert.equal(createdSongRequest.spotify_id, song.spotifyInfo.id)
      assert.equal(createdSongRequest.is_processing, false)
    })

    it ('creates a songRequest if neither song nor songRequest exist', async function () {
      var createdSongRequest = await lib.getOrCreateSongRequest('totallyDifferentSpotifyID')
      assert.equal(createdSongRequest.song_id, '')
      assert.equal(createdSongRequest.spotify_id, 'totallyDifferentSpotifyID')
      sinon.assert.calledWith(songRequestPublishStub, events.SONGREQUEST_CREATED, createdSongRequest)
    })
  })

  describe ('createSongRequest', function () {
    it ('creates a songRequest', async function () {
      createdSongRequest = await lib.createSongRequest('mySpotifyID')
      assert.equal(createdSongRequest.spotify_id, 'mySpotifyID')
      assert.equal(createdSongRequest.status, status.GETTING_SPOTIFY_INFO)
      assert.equal(createdSongRequest.is_processing, true)
    })

    it ('broadcasts that it was created', async function () {
      createdSongRequest = await lib.createSongRequest('mySpotifyID')
      sinon.assert.calledWith(songRequestPublishStub, events.SONGREQUEST_CREATED, createdSongRequest)
    })
  })

  describe ('completeReplaceAudioForSong', function () {
    it ('updates the song with the new key', async function () {
      var updatedSong = await lib.completeReplaceAudioForSong({ key: 'aNewKey', songID: song.id })
      assert.equal(updatedSong.key, 'aNewKey')
    })
  })

  describe ('completeSongAcquisition', function () {
    it ('adds the new song to the db', async function () {
      var completedSongRequest = await lib.completeSongAcquisition({ spotifyID: songRequest.spotify_id, key: 'aNewKey' })
      var newSong = completedSongRequest.song
      assert.equal(newSong.spotifyInfo.id, spotifyInfo.id)
      assert.equal(newSong.album, spotifyInfo.album.name)
      assert.equal(newSong.title, spotifyInfo.name)
      assert.equal(newSong.explicit, spotifyInfo.explicit)
      assert.equal(newSong.isrc, spotifyInfo.external_ids.isrc)
      assert.equal(newSong.albumArtworkUrl, spotifyInfo.album.images[0].url)
      assert.equal(newSong.artist, spotifyInfo.artists[0].name)
    })

    it ('updates the old songRequest', async function () {
      var completedSongRequest = await lib.completeSongAcquisition({ spotifyID: songRequest.spotify_id, key: 'aNewKey' })
      assert.isObject(completedSongRequest.song)
      assert.equal(completedSongRequest.song_id, completedSongRequest.song.id)
      assert.equal(completedSongRequest.is_processing, false)
    })
    
    it('updates the songRequest and key if the song already exists', async function () {
      var newSong = await Song.create({ spotifyInfo: { id: songRequest.spotify_id }, key: 'oldKey' })
      var completedSongRequest = await lib.completeSongAcquisition({ spotifyID: songRequest.spotify_id, key: 'aNewKey' })
      assert.equal(completedSongRequest.song.id, newSong.id)
      assert.equal(completedSongRequest.song_id, newSong.id)
      assert.equal(completedSongRequest.song.key, 'aNewKey')
    })
  })
})

