import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import style from '../../../styles/Components/VideoMain/BroadcastVideo/BroadcastVideo.module.css'

const Video = (props) => {
    const videoNode = useRef(null)
    let { client, availableTracks, styles } = props

    return (
        <div className={style.videoContainer} style={styles}>
            <video ref={videoNode} />
        </div>
    )
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
        <div className={style.videoContainer}>
            <video ref={ref} id="broadcast-video" />
        </div>
    )
}

Video.propTypes = {
    client: PropTypes.object,
    availableTracks: PropTypes.array,
    clientCount: PropTypes.number,
}

export default Video
