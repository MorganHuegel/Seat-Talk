const { knex } = require('../../database/connectToDb')

function _handleErrors(socket, err, functionName) {
    console.log(`ERROR in ${functionName}: ${err}`)
    socket.emit('error', { errorMessage: err.message })
}

async function _getAllClientsInRoom(room_pk) {
    return knex('room_clients')
        .join('clients', 'room_clients.client_pk', '=', 'clients.id')
        .select('clients.*')
        .whereNull('clients.disconnected_at')
        .where('room_clients.room_pk', '=', room_pk)
}

async function handleConnect(socket, io) {
    try {
        const socket_id = socket.id
        const existing = await knex
            .select()
            .table('clients')
            .whereNull('disconnected_at')
            .where({ socket_id })

        if (existing.length > 0) {
            throw new Error(
                'Server Error: There are multiple connected clients with same client ID ' +
                    socket_id
            )
        }

        let insertResponse = await knex('clients').insert({ socket_id }).returning('id')
        let clientDatabaseId = insertResponse[0]
        socket.emit('connectConfirm', { clientDatabaseId })
    } catch (err) {
        _handleErrors(socket, err, 'handleConnect')
    }
}

async function handleJoinRoom(socket, io, roomId, clientDatabaseId) {
    // clientDatabaseId is the id column in 'clients' table
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

        let room_pk
        if (activeRooms.length === 0) {
            let roomData = await knex('rooms').insert({ room_id: roomId }).returning('id')
            room_pk = roomData[0]
        } else {
            room_pk = activeRooms[0].id
        }

        socket.join(roomId)
        const client_pk = clientDatabaseId
        await knex('room_clients').insert({ room_pk, client_pk })
        const allClientsInRoom = await _getAllClientsInRoom(room_pk)
        if (allClientsInRoom.length < 1) {
            throw new Error('No clients found in room ' + roomId)
        }
        io.to(roomId).emit('newJoin', { allClientsInRoom, newSocketId: socket.id })
    } catch (error) {
        _handleErrors(socket, error, 'handleJoinRoom')
    }
}

async function handleDisconnect(socket, io) {
    try {
        const socket_id = socket.id
        const clientData = await knex('clients')
            .whereNull('disconnected_at')
            .where({ socket_id })
            .update({ disconnected_at: new Date().toISOString() }, ['id'])

        if (clientData.length === 0) {
            throw new Error('Could not update client with socket ID ', socket_id)
        }

        const client_pk = clientData[0].id
        const room_client_row = await knex('room_clients').select('room_pk').where({ client_pk })
        const { room_pk } = room_client_row[0]
        const allClientsInRoom = await _getAllClientsInRoom(room_pk)

        if (allClientsInRoom.length === 0) {
            await knex('rooms')
                .where({ id: room_pk })
                .update({ closed_at: new Date().toISOString() })
        } else {
            const roomData = await knex('rooms').select('room_id').where({ id: room_pk })
            if (roomData.length === 0) {
                throw new Error('Could not emit userLeftRoom event to other users')
            }
            const { room_id } = roomData[0]
            io.to(room_id).emit('userLeftRoom', { socket_id })
        }
    } catch (error) {
        _handleErrors(socket, error, 'handleDisconnect')
    }
}

async function handleWatcherJoin(socket, io, roomId, requestingSocketId) {
    try {
        const roomData = await knex('rooms')
            .select('id')
            .whereNull('closed_at')
            .where({ room_id: roomId })
        if (roomData.length > 1) {
            throw new Error('Multiple rooms open with the ID: ' + roomId)
        }
        if (roomData.length === 0) {
            throw new Error('Room ' + roomId + ' just closed.')
        }
        const room_pk = roomData[0].id
        let allClientsInRoom = await _getAllClientsInRoom(room_pk)
        allClientsSharing = allClientsInRoom.filter(
            (client) =>
                client.is_sharing_video || client.is_sharing_audio || client.is_sharing_screen
        )

        allClientsSharing.forEach((client) => {
            io.to(client.socket_id).emit('watcherRequest', { requestingSocketId })
        })
    } catch (error) {
        _handleErrors(socket, error, 'handleWatcherJoin')
    }
}

async function handleUpdateSharing(socket, io, props) {
    try {
        const { client_pk, is_sharing_video, is_sharing_audio, is_sharing_screen } = props
        const updatedUser = await knex('clients')
            .where({ id: client_pk })
            .update({ is_sharing_audio, is_sharing_screen, is_sharing_video })
            .returning('*')

        socket.emit('updateSharing', { updatedUser: updatedUser[0] })
    } catch (error) {
        _handleErrors(socket, error, 'handleUpdateSharing')
    }
}

async function handleOffer(socket, io, offer, sendToSocketId) {
    io.to(sendToSocketId).emit('offer', { offer, sentFromSocketId: socket.id })
}

async function handleAnswer(socket, io, localDescription, sendToSocketId) {
    io.to(sendToSocketId).emit('answer', { localDescription, sentFromSocketId: socket.id })
}

async function handleCandidate(socket, io, sendToSocketId, candidate) {
    io.to(sendToSocketId).emit('candidate', { fromSocketId: socket.id, candidate })
}

module.exports = {
    handleConnect,
    handleJoinRoom,
    handleDisconnect,
    handleWatcherJoin,
    handleUpdateSharing,
    handleOffer,
    handleAnswer,
    handleCandidate,
}
