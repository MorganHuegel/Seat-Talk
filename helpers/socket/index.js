const { knex } = require('../../database/connectToDb')
const { Log } = require('../Logger')

function _handleErrors(socket, err, functionName) {
    Log(`ERROR in ${functionName}: ${err}`)
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
        Log(`Socket connected with socket id of: ${socket_id}`)
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

async function handleJoinRoom(socket, io, roomId, clientDatabaseId, displayName) {
    // clientDatabaseId is the id column in 'clients' table
    try {
        let activeRooms = await knex
            .select()
            .table('rooms')
            .whereNull('closed_at')
            .where({ room_id: roomId })

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
        await Promise.all([
            knex('clients').where('id', '=', client_pk).update({ display_name: displayName }),
            knex('room_clients').insert({ room_pk, client_pk }),
        ])
        const [allClientsInRoom, chatMessages] = await Promise.all([
            _getAllClientsInRoom(room_pk),
            knex
                .select('chats.*')
                .table('room_clients')
                .join('chats', 'room_clients.client_pk', '=', 'chats.client_pk')
                .where({ room_pk }),
        ])
        if (allClientsInRoom.length < 1) {
            throw new Error('No clients found in room ' + roomId)
        }
        io.to(roomId).emit('newJoin', { allClientsInRoom, chatMessages, newSocketId: socket.id })
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
        const allOtherClients = allClientsInRoom.filter((client) => client.socket_id !== socket.id)

        allOtherClients.forEach((client) => {
            io.to(client.socket_id).emit('watcherRequest', { requestingSocketId })
        })
    } catch (error) {
        _handleErrors(socket, error, 'handleWatcherJoin')
    }
}

async function handleUpdateSharing(socket, io, clientData, roomId) {
    try {
        const {
            client_pk,
            audio_track_id,
            video_track_id,
            screen_audio_track_id,
            screen_video_track_id,
        } = clientData

        let updateObj = {
            audio_track_id,
            video_track_id,
            screen_audio_track_id,
            screen_video_track_id,
        }
        if (audio_track_id) updateObj.did_share_audio = true
        if (video_track_id) updateObj.did_share_video = true
        if (screen_audio_track_id) updateObj.did_share_screen_audio = true
        if (screen_video_track_id) updateObj.did_share_screen_video = true

        const updatedUser = await knex('clients')
            .where({ id: client_pk })
            .update(updateObj)
            .returning('*')

        io.to(roomId).emit('updateSharing', { updatedUser: updatedUser[0] })
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

async function handleAddedPeerConnectionTrack(socket, io, trackId, clients) {
    clients.forEach((clientId) => {
        io.to(clientId).emit('addedPeerConnectionTrack', { trackId, fromSocketId: socket.id })
    })
}

async function handleRenegotiate(socket, io, toSocketId) {
    // io.to(toSocketId).emit('watcherRequest', { requestingSocketId: socket.id })
}

async function handleChat(socket, io, msg) {
    const { type, message, fromDbId } = msg
    const chat = await knex('chats').insert({ type, message, client_pk: fromDbId }).returning('*')
    const serializedMsg = {
        id: chat[0].id,
        clientPk: chat[0].client_pk,
        type: chat[0].type,
        message: chat[0].message,
        createdAt: chat[0].created_at,
        fromSocket: socket.id,
    }
    socket.emit('chat', serializedMsg)
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
    handleAddedPeerConnectionTrack,
    handleRenegotiate,
    handleChat,
}
