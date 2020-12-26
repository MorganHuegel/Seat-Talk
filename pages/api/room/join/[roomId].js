import { knex } from '../../../../database/connectToDb'

export default async (req, res) => {
    console.log('here', req.query)
    const { roomId } = req.query
    try {
        let activeRooms = await knex
            .select()
            .table('channels')
            .whereNull('closed_at')
            .where({ room_id: roomId })

        // write stream client's video to file at /streams/[room(roomId)]/[clientId]/video.txt|audio.txt|screen.txt
        // other client creates readStream from that file
        if (activeRooms.length > 1) {
            return res.status(500).json({
                error:
                    'Yikes! There are two open rooms for this room ID ' +
                    roomId +
                    '. Better fix this!',
            })
        }

        if (activeRooms.length === 1) {
            let activeRoom = activeRooms[0]
        }
        return res.status(200).json({ foo: 'bar' })
    } catch (error) {
        console.log('ERROR: ', error)
        return res.status(400).json({ error })
    }
}
