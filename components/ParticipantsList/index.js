import React from 'react'
import style from '../../styles/Components/ParticipantsList/ParticipantsList.module.css'

const ParticipantsList = ({ allClientsInRoom }) => {
    const sortedClients = allClientsInRoom
        .map((c) => ({ name: c.display_name, key: c.socket_id }))
        .sort((a, b) => {
            const nameA = a.name.toUpperCase()
            const nameB = b.name.toUpperCase()
            if (nameA < nameB) {
                return -1
            }
            if (nameA > nameB) {
                return 1
            }

            return 0
        })

    return (
        <ul className={style.participantsList}>
            {sortedClients.map((c) => (
                <li key={c.key}>{c.name}</li>
            ))}
        </ul>
    )
}

export default ParticipantsList
