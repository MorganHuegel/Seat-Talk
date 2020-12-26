// Express setup
const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

// Socket.io setup
const { handleJoinRoom, handleDisconnecting, handleConnect } = require('./helpers/socket')
io.on('connect', (socket) => {
    handleConnect(socket, io)
    socket.on('joinRoom', ({ roomId }) => handleJoinRoom(socket, io, roomId))
    socket.on('disconnecting', () => handleDisconnecting(socket, io))
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
