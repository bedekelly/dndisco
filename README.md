# DnDisco 🐉🕺🎲

Simple networked soundboard for DMs playing games online, or anyone else.

Requirements:

- jq
- nodemon
- ngrok

To run in development, run these three commands in separate tabs:

```
$ ./server.sh
$ ./ngrok.sh
$ ./run.sh
```

In production, configure the socket server URL manually and use `yarn build` to create a production bundle. Serve the bundle statically using your tool of choice. Run the server as before.

Roadmap:
- [x] Host can upload files via drag-n-drop
- [x] Host can play pads by clicking them
- [x] Host should see a visualisation of the playing audio
- [x] Host should see a volume control (just for their audio)

- [x] Host should have a randomly generated ID pushed to the URL
- [x] When the page reloads, host should keep the same pads.
- [ ] When the page reloads 1 time, host's file downloads should be instant
- [x] When the page reloads N+1 times, host's file downloads should be instant

- [ ] Clients should see a visualiser and a volume control
- [ ] Clients should download all initial sounds used by the host
- [ ] Clients should download all _subsequent_ sounds uploaded by the host
- [ ] When host plays a sound, clients should also play that sound

- [ ] Server should store information about the current "playing" state
- [ ] When clients join _during_ a sound, they should start playing partway through

- [ ] When clients load audio files they've seen before, it should be very quick

- [ ] Hosts should see how many clients are connected
- [ ] Hosts should see how many clients are _synchronised_ correctly
