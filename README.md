# pl-song-service
The song service handles creation of all Songs for Playola.  

## Song Creation
To create a song, it's spotify data must be downloaded, YouTube must be searched for a list of potential matches, the audio must be converted and uploaded to s3, and finally the Song object must is created with a link to the new audio.

To start the process off, send a POST request to `/songRequest/{spotifyID}`. If the song already exists, the created songRequest will include the `songID` and the `song`.  Otherwise it will fire off the following process:

1. A SongRequest object will be created and a SONG\_REQUEST\_CREATED event will fire
2. The Spotify service will respond to the event and, retreive the spotify info for the song, and broadcast a SPOTIFY\_INFO\_RECEIVED event with the new info
3. Both the Song Service and the YouTube_Searcher service listen for the SPOTIFY\_INFO\_RECEIVED event.  The Song service updates the SongRequest object with the new info.  The YouTubeSearcher service obtains a list of possible matches from YouTube and fires a YOUTUBE\_INFO\_RECEIVED event.
4. The Song service listens for the YOUTUBE\_INFO\_RECEIVED event and spins off a lambda function to obtain the audio and upload it to the proper S3 bucket
5. When the lambda function is finished, it fires a POST call to `/songRequests/complete/{spotifyID}` to notify that the audio has been obtained.  That POST request creates a new Song object and updates the SongRequest object to reflect completion.

## Environments

| Environment | Branch      | URL                                       | CI    |
|-------------|-------------|-------------------------------------------|-------|
| Development | development | http://songs-staging.playola.services |[![CircleCI](https://circleci.com/gh/briankeane/pl-song-service/tree/develop.svg?style=svg&circle-token=2a5149788cdcf700caa97f286a4e0361fe441c25)](https://circleci.com/gh/briankeane/pl-song-service/tree/develop)|
| Production  | master      | https://songs.playola.services         |![CircleCI](https://circleci.com/gh/briankeane/pl-song-service/tree/master.svg?style=svg&circle-token=2a5149788cdcf700caa97f286a4e0361fe441c25)|

## Deployments

Heroku is setup to automatically deploy any pull request merged into development and master into the corresponding environments (see table above).

## Local Development

### Configuring the environment variables

Create an `.env` file that provides the environment variables as demonstrated in the [.env-example](https://github.com/briankeane/pl-song-service/blob/master/.env-example) file.

### Docker
Make sure you have [Docker](https://www.docker.com) up and running.

### Running the app
```
docker-compose up --build
```

### Running the tests

Run the unit tests like so:

```
docker exec -it pl_song_service npm run test-local
```