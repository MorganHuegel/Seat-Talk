import { knex } from '../../../../database/connectToDb'

export default async (req, res) => {
    const { sessionId } = req.query
    try {
        let activeSessions = await knex
            .select()
            .table('channels')
            .whereNull('closed_at')
            .where({ session_id: sessionId })

        if (activeSessions.length > 1) {
            return res.status(500).json({
                error: 'Yikes! There are two open sessions for this session ID. Better fix this!',
            })
        }

        if (activeSessions.length === 1) {
            let activeSession = activeSessions[0]
        }
        return res.status(200).json({ foo: 'bar' })
    } catch (error) {
        console.log('ERROR: ', error)
        return res.status(400).json({ error })
    }
}
