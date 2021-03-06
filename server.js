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
    handleChat,
} = require('./helpers/socket')
const { Log } = require('./helpers/Logger')
io.on('connect', (socket) => {
    handleConnect(socket, io)
    socket.on('joinRoom', ({ roomId, clientDatabaseId, displayName }) =>
        handleJoinRoom(socket, io, roomId, clientDatabaseId, displayName)
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
    socket.on('connect_error', (err) => {
        Log(`socket with ID ${socket.id} has connect_error: "${err.message}."`)
    })
    socket.on('heartbeatHeroku', () => {
        Log(`socket with ID ${socket.id} preventing Heroku from sleeping`)
    })
    socket.on('chat', (msg, roomId) => handleChat(socket, io, msg, roomId))
    socket.on('disconnect', (reason) => {
        if (reason) {
            Log(`socket with ID ${socket.id} disconnected because of "${reason}."`)
        }
        handleDisconnect(socket, io)
    })
})

// Next setup
const next = require('next')
const dev = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 3000
const nextApp = next({ dev })
const nextHandler = nextApp.getRequestHandler()

nextApp.prepare().then(() => {
    app.all('*', (req, res) => {
        return nextHandler(req, res)
    })

    server.listen(port, (err) => {
        if (err) {
            throw err
        }
        Log('listening on port ' + port)
    })
})
