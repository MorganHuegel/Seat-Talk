import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { io } from 'socket.io-client'
import VideoMain from '../components/VideoMain'

function Room() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const roomId = router.query.room
    let socket = null

    useEffect(() => {
        async function joinRoom() {
            let response = await fetch(`/api/room/join/${roomId}`)
            if (!response.ok || response.status !== 200) {
                setErrorMessage(`Could not join room ${roomId}.`)
                return
            }

            response = await response.json()
            if (response.error) {
                setErrorMessage(JSON.stringify(response.error))
                return
            }
            console.log('successful response: ', response)
            socket = io()
            socket.on('new', (data) => console.log(data))
            setIsLoading(false)
        }

        if (roomId) {
            joinRoom()
        }
    }, [roomId])

    if (errorMessage) {
        return <p>{errorMessage}</p>
    } else if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <>
            <VideoMain roomId={roomId} />
        </>
    )
}

export default Room
