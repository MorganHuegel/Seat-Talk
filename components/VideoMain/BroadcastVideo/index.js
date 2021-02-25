import React, { useState, useEffect } from 'react'
import style from '../../../styles/Components/VideoMain/BroadcastVideo/BroadcastVideo.module.css'
import { PeerConnectionButton } from '../../Buttons'
import { useRouter } from 'next/router'
import { CopyButton } from '../../Buttons'

const BroadcastVideo = React.forwardRef((props, ref) => {
    const router = useRouter()
    let { allClientsInRoom, availableTracks } = props
    let [currentVideoTrackId, setCurrentVideoTrackId] = useState(null)

    useEffect(() => {
        // remove tracks that are no longer available
        if (!availableTracks.length) {
            ref.current.srcObject = null
        }
        let stream = ref.current.srcObject
        if (stream) {
            stream.getTracks().forEach((track) => {
                if (!availableTracks.some((t) => t.id === track.id)) {
                    track.stop()
                    stream.removeTrack(track)
                }
            })
        }

        if (!currentVideoTrackId || !availableTracks.find((t) => t.id === currentVideoTrackId)) {
            let videoTrack = availableTracks.find((t) => t.kind === 'video')
            setCurrentVideoTrackId(videoTrack ? videoTrack.id : null)
        }
    }, [availableTracks])

    async function addTracks() {
        const stream = new MediaStream()
        availableTracks.forEach((t) => {
            if (t.kind === 'audio' || t.id === currentVideoTrackId) {
                stream.addTrack(t)
            }
        })
        ref.current.srcObject = stream
        if (ref.current.paused) {
            await ref.current.play()
        }
    }

    if (ref.current && availableTracks.length) {
        addTracks()
    }

    return (
        <div className={style.container}>
            <div className={style.topBar}>
                <h2>
                    <span className={style.label}>Room Name:</span> /{router.query.room}
                </h2>
                <CopyButton copyString={window.location.href} />
            </div>
            <div className={style.videoContainer}>
                <video ref={ref} id="broadcast-video" />
            </div>
        </div>
    )
})

export default BroadcastVideo
