import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import VideoMain from '../components/VideoMain'

function Session() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const sessionId = router.query.session

    useEffect(() => {
        async function joinSession() {
            let response = await fetch(`/api/session/join/${sessionId}`)
            console.log(response.status, response.ok)
            if (!response.ok || response.status !== 200) {
                setErrorMessage(`Could not join session ${sessionId}.`)
                return
            }

            response = await response.json()
            setIsLoading(false)
            console.log('response', response)
        }

        if (sessionId) {
            joinSession()
        }
    }, [sessionId])

    if (errorMessage) {
        return <p>{errorMessage}</p>
    } else if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <>
            <VideoMain sessionId={sessionId} />
        </>
    )
}

export default Session
