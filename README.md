# DnDisco 🐉🕺🎲

Simple networked soundboard for DMs playing games online, or anyone else.

Requirements:

* jq
* nodemon
* ngrok


To run in development, run these three commands in separate tabs:
```
$ ./server.sh
$ ./ngrok.sh
$ ./run.sh
```

In production, configure the socket server URL manually and use `yarn build` to create a production bundle. Serve the bundle statically using your tool of choice. Run the server as before. 


Roadmap: 

- [x] Upload and play sounds w/ drag-n-drop (DnD!)
- [x] Clients hear what host hears
- [x] Unused files are cleaned up
- [x] Host sees when all clients are synchronised  
- [x] Hosts and clients see a sound visualisation
- [x] Playback progress of longer-running files is synced
- [ ] Hosts create unique rooms for clients to join
- [ ] Create a decent abstraction layer for websockets
- [ ] Speed up sync notifications
- [ ] Improve self-hosting developer experience
- [ ] Provide hosted solution / user logins
