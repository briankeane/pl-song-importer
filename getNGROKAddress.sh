#!/bin/bash
echo "IN SCRIPT"

unset BASE_URL
until [ "${BASE_URL:-}" ]
do
  echo "DOING"
    rootURL=$(curl --connect-timeout 5 'pl_song_service_ngrok:4040/api/tunnels' \
              | sed -nE 's/.*public_url":"https:..([^"]*).*/\1/p')
    printf "--------- 2 ---------"
    echo $rootUrL
    if [ [ "${rootURL:-}" ] ]
    then
      
      export BASE_URL="https://${rootURL}"
    else
      printf "sleeping 2"
      sleep 2
    fi
done 

echo "FINISHING"



echo "SETTING BASE_URL to: ${BASE_URL}"
env-cmd .env nodemon index.js