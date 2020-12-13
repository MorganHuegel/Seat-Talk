import { useRouter } from 'next/router'
import VideoMain from '../components/VideoMain'

function Session() {
    const router = useRouter()
    const sessionId = router.query.session

    return (
        <>
            <p>{sessionId}</p>
            <VideoMain sessionId={sessionId} />
        </>
    )
}

export default Session
