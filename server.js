// Express setup
const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

// Socket.io setup
const {
    handleConnect,
    handleJoinRoom,
    handleDisconnect,
    handleWatcherJoin,
    handleUpdateSharing,
    handleCandidate,
    handleOffer,
} = require('./helpers/socket')
io.on('connect', (socket) => {
    handleConnect(socket, io)
    socket.on('joinRoom', ({ roomId, clientDatabaseId }) =>
        handleJoinRoom(socket, io, roomId, clientDatabaseId)
    )
    socket.on('updateSharing', (props) => handleUpdateSharing(socket, io, props))
    socket.on('watcherJoin', ({ roomId, requestingSocketId }) =>
        handleWatcherJoin(socket, io, roomId, requestingSocketId)
    )
    socket.on('offer', ({ offer, requestingSocketId }) =>
        handleOffer(socket, io, offer, requestingSocketId)
    )
    socket.on('candidate', ({ socketId, candidate }) =>
        handleCandidate(socket, io, socketId, candidate)
    )
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
