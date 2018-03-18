const { assert } = require('chai')
const faker = require('faker')
const mocha = require('mocha')
const after = mocha.after
const before = mocha.before
const beforeEach = mocha.beforeEach
const afterEach = mocha.afterEach
const describe = mocha.describe
const it = mocha.it

const db = require('../lib/db')
const errors = require('../lib/errors')

describe('DB', function () {
  describe('SongRequests', function () {
    let createdSongRequest = null
    let fakeSongRequest = null
    let fakeSongRequests = []

    before(async function () {
      for (let i = 0; i < 10; i++) {
        let spotifyInfo = {
          id: faker.random.uuid(),
          title: faker.random.words(),
          artists: [{ name: faker.random.words() }],
          album: { name: faker.random.words(), image: [{ url: faker.internet.url() }]},
          external_ids: { isrc: faker.lorem.word() },
          duration_ms: faker.random.number()
        }
        fakeSongRequests.push(await db.createSongRequest({ spotify_info: spotifyInfo })) 
      }
    })

    beforeEach(async function () {
      let spotifyInfo = {
          id: faker.random.uuid(),
          title: faker.random.words(),
          artists: [{ name: faker.random.words() }],
          album: { name: faker.random.words(), image: [{ url: faker.internet.url() }]},
          external_ids: { isrc: faker.lorem.word() },
          duration_ms: faker.random.number()
        }
      fakeSongRequest = await db.createSongRequest({ spotify_info: spotifyInfo })
    })

    after(async function () {
      for (let songRequest of fakeSongRequests) {
        await db.removeSongRequestWithID(songRequest.id)
      }

      try {
        await db.removeSongRequestWithID(songRequest.id)
      } catch (error) {}
    })

    afterEach(async function () {
      await db.removeSongRequestWithID(fakeSongRequest.id)

      try {
        await db.removeSongRequestWithID(createdSongRequest.id)
      } catch (error) {}
    })

    describe('Get', function () {
      it('should return a songRequest (id)', async function () {
        let songRequest = await db.getSongRequestWithID(fakeSongRequest.id)
        assert.notEqual(songRequest, null)
        assert.deepEqual(songRequest.spotify_info, fakeSongRequest.spotify_info)
      })

      it('should return a songRequest (spotify_id)', async function () {
        let songRequest = await db.getSongRequestWithSpotifyID(fakeSongRequest.spotify_id)
        assert.notEqual(songRequest, null)
        assert.deepEqual(songRequest.spotify_info, fakeSongRequest.spotify_info)
      })
    })

    describe('Put', function () {
      it ('should add a status to the shit', async function () {
        const savedSongRequest = await db.updateSongRequestWithID(fakeSongRequest.id, { status: errors.MATCH_NOT_FOUND })
        let songRequest = await db.getSongRequestWithID(fakeSongRequest.id)
        assert.equal(songRequest.status, errors.MATCH_NOT_FOUND)
      })
      
      it ('should add youtube_matches', async function () {
        const jsonArrayToSave = JSON.stringify([{ this: 'isAwesome' }])
        const savedSongRequest = await db.updateSongRequestWithID(fakeSongRequest.id, { youtube_matches: jsonArrayToSave })
        let songRequest = await db.getSongRequestWithID(fakeSongRequest.id)
        assert.equal(JSON.stringify(songRequest.youtube_matches), jsonArrayToSave)
      })

      it.only ('adds a timestamp', async function () {
        const savedSongRequest = await db.updateSongRequestWithID(fakeSongRequest.id, { completed: 'NOW()' })
        console.log(savedSongRequest.completed)
      })
    })
  })
})