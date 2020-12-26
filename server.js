// Express setup
const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

// Socket.io setup
io.on('connect', (socket) => {
    // console.log('client connected: socket is...', socket)
    console.log('-------------------------------')
    console.log('client connected: socket is...', socket.client.id)
    console.log('client connected: socket is...', socket.id)
    io.emit('new', { newClientId: socket.client.id })
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
