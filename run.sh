#!/bin/bash

NGROK_URL=$(curl --silent --show-error http://localhost:4040/api/tunnels | jq .tunnels[1].public_url)

REACT_APP_SOCKET_SERVER_URL=$NGROK_URL yarn start
