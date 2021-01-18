1. Client socket created and connects
2. Server handleConnect fires, inserts into clients table, then emits connectConfirm
3. Client connectConfirm fires, emits 'joinRoom'
4. Server handlJoinRoom fires, which creates room or adds client to existing room. emits newJoin
5. Client updates state with allClientsInRoom. The newly added client emits watcherJoin
6. Server handleWatcherJoin fires, gets updated list of all other clients, emits 'watcherRequest' to each of them
7. Client watcherRequest fires, creates new RTCPeerConnection, addes it to state with key of requestingSocketId, adds all of ownVideo media tracks to that peer connection. creates offer, sets localDescripiton, and sends offer back to requesting socketId
8. Server handleOffer fires, forwards offer to the requestingClientId
9. Client offer fires. Peer connection is created with person who sent the offer. creates and sends an answer back to the person who sent offer, and updates state with that peer connection
10. Server handleAnswer fires, forwards answer to the peer who sent the offer.
11. Client answer fires. Gets the local descriptino of the answer and updates peerConnections in state
12. Once icecandidate is found, onicecandidate event is triggered on client side for both peers. checks STUN server first, and if that is not possible, checks TURN server (both can be passed in webrtc config)
13. when ICE (interactive connectivity establishment) candidate is found, Client emits candidate socket event to share candidate with peer
14.
