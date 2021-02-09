// Express setup
const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
require('dotenv').config()

// Socket.io setup
const {
    handleConnect,
    handleJoinRoom,
    handleDisconnect,
    handleWatcherJoin,
    handleUpdateSharing,
    handleOffer,
    handleAnswer,
    handleCandidate,
    handleAddedPeerConnectionTrack,
    handleRenegotiate,
} = require('./helpers/socket')
io.on('connect', (socket) => {
    handleConnect(socket, io)
    socket.on('joinRoom', ({ roomId, clientDatabaseId }) =>
        handleJoinRoom(socket, io, roomId, clientDatabaseId)
    )
    socket.on('updateSharing', (clientInfo, roomId) =>
        handleUpdateSharing(socket, io, clientInfo, roomId)
    )
    socket.on('watcherJoin', ({ roomId, requestingSocketId }) =>
        handleWatcherJoin(socket, io, roomId, requestingSocketId)
    )
    socket.on('offer', ({ offer, sendToSocketId }) =>
        handleOffer(socket, io, offer, sendToSocketId)
    )
    socket.on('answer', ({ localDescription, sendToSocketId }) =>
        handleAnswer(socket, io, localDescription, sendToSocketId)
    )
    socket.on('candidate', ({ sendToSocketId, candidate }) =>
        handleCandidate(socket, io, sendToSocketId, candidate)
    )
    socket.on('addedPeerConnectionTrack', ({ trackId, clients }) =>
        handleAddedPeerConnectionTrack(socket, io, trackId, clients)
    )
    socket.on('renegotiate', ({ toSocketId }) => handleRenegotiate(socket, io, toSocketId))
    socket.on('disconnect', () => handleDisconnect(socket, io))
})

// Next setup
const next = require('next')
const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev })
const nextHandler = nextApp.getRequestHandler()

nextApp.prepare().then(() => {
    app.all('*', (req, res) => {
        return nextHandler(req, res)
    })

    server.listen(3000, (err) => {
        if (err) {
            throw err
        }
        console.log('listening on http://localhost:' + 3000)
    })
})
