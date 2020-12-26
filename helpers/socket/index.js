const { knex } = require('../../database/connectToDb')

function _handleErrors(socket, err, functionName) {
    console.log(`ERROR in ${functionName}: ${err}`)
    socket.emit('error', { errorMessage: err.message })
}

async function handleConnect(socket, io) {
    try {
        const client_id = socket.client.id
        const existing = await knex
            .select()
            .table('clients')
            .whereNull('disconnected_at')
            .where({ client_id })

        if (existing.length > 0) {
            throw new Error(
                'Server Error: There are multiple connected clients with same client ID ' +
                    client_id
            )
        }

        await knex('clients').insert({ client_id }).returning()
        socket.emit('connectConfirm', {})
    } catch (err) {
        _handleErrors(socket, err, 'handleConnect')
    }
}

async function handleJoinRoom(socket, io, roomId) {
    try {
        let activeRooms = await knex
            .select()
            .table('rooms')
            .whereNull('closed_at')
            .where({ room_id: roomId })

        // write stream client's video to file at /streams/[room(roomId)]/[clientId]/video.txt|audio.txt|screen.txt
        // other client creates readStream from that file
        if (activeRooms.length > 1) {
            throw new Error('Yikes! There are more than one active rooms with ID ' + roomId)
        }

        async function getClientPK() {
            const clientData = await knex('clients')
                .select('id')
                .whereNull('disconnected_at')
                .where({ client_id: socket.client.id })

            if (clientData.length > 1) {
                throw new Error('More than one active socket with client ID: ' + socket.client.id)
            }
            if (clientData.length === 0) {
                throw new Error('Socket client no longer active')
            }

            return clientData[0].id
        }

        async function getAllClientsInRoom(room_pk) {
            return knex('room_clients')
                .join('clients', 'room_clients.client_pk', '=', 'clients.id')
                .select('clients.*')
                .where('room_clients.room_pk', '=', room_pk)
        }

        if (activeRooms.length === 1) {
            socket.join(roomId)
            let room_pk = activeRooms[0].id
            const client_pk = await getClientPK()
            await knex('room_clients').insert({ room_pk, client_pk })
            const allClientsInRoom = await getAllClientsInRoom(room_pk)
            if (allClientsInRoom.length < 1) {
                throw new Error('No clients found in room ', +roomId)
            }
            io.to(roomId).emit('newJoin', { allClientsInRoom })
        }

        if (activeRooms.length === 0) {
            socket.join(roomId)
            const [room_pk] = await knex('rooms').insert({ room_id: roomId }).returning('id')
            const client_pk = await getClientPK()
            await knex('room_clients').insert({ room_pk, client_pk })
            const allClientsInRoom = await getAllClientsInRoom(room_pk)
            if (allClientsInRoom.length < 1) {
                throw new Error('No clients found in room ', +roomId)
            }
            io.to(roomId).emit('newJoin', { allClientsInRoom })
        }
    } catch (error) {
        _handleErrors(socket, error, 'handleJoinRoom')
    }
}

async function handleDisconnecting(socket, io) {
    socket.rooms.forEach((room) => {
        io.to(room).emit('userLeftRoom', { clientId: socket.client.id })
    })
}

module.exports = {
    handleConnect,
    handleJoinRoom,
    handleDisconnecting,
}
