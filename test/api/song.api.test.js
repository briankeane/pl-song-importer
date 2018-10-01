'use strict';

const Song              =   require('../../lib/mongoose/song')

const db                =   require('../../lib/db')
const app               =   require('../../app')
const request           =   require('supertest')
const expect            =   require('chai').expect
const mongoose          =   require('mongoose')
const sinon             =   require('sinon')

describe('song API endpoints', function() {
  before(function(done) {
    mongoose.connection.once('open', function () {
      done()
    })
  })

  var song, songs

  beforeEach(async function () {
    for (let i=0;i<10;i++) {
      var song = await Song.create({ artist: `artist{i}`})
    }  
  })

  
  afterEach(async function () {
    var requests = await db.getAllSongRequests()
    for (let request of requests) {
      await db.removeSongRequestWithID(request.id)
    }
    await Song.find({}).remove()
  })

  describe ('POST /v1/songRequests/:spotifyID', function () {
    it ('responds with the song if it already exists', function (done) {
      Song.create({ title: 'bobsSong', artist: 'bob', spotifyInfo: { id: 'bobsSpotifyID' } }, function (err, createdSong) {
        request(app)
        .post('/v1/songRequests/' + 'bobsSpotifyID')
        .set('Authorization', process.env.API_TOKEN)
        .set('Content-Type', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            console.log('you have fucked up')
            console.log(err, res.body)
            done(err);
          } else {
            console.log(res.body)
            expect(res.body.song.id).to.equal(createdSong.id);
            expect(res.body.status).to.equal("The song has been processed");
            done()
          }
        })
      })
    })

    it ('returns a songRequest if it exists', function (done) {
      db.createSongRequest({ spotify_id: 'bobsSpotifyID',
                             is_processing: true })
        .then(createdRequest => {
          request(app)
            .post('/v1/songRequests/' + 'bobsSpotifyID')
            .set('Authorization', process.env.API_TOKEN)
            .set('Content-Type', 'application/json')
            .expect(200)
            .end(function (err, res) {
              if (err) {
                console.log('you have fucked up')
                console.log(err, res.body)
                done(err)
              } else {
                expect(res.body.is_processing).to.equal(true)
                expect(res.body.id).to.equal(createdRequest.id)
                done()
              }
            })
        })
        .catch(err => done(err))
    }) 
  })
})