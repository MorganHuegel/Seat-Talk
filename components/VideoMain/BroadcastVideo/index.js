import React, { useState, useEffect } from 'react'
import style from '../../../styles/Components/VideoMain/BroadcastVideo/BroadcastVideo.module.css'
import { PeerConnectionButton } from '../../Buttons'

const BroadcastVideo = React.forwardRef((props, ref) => {
    let { peerConnections, allClientsInRoom, availableTracks } = props
    let [currentVideoTrackId, setCurrentVideoTrackId] = useState(null)
    console.log('availableTracks', availableTracks)

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
        const stream = ref.current.srcObject || new MediaStream()
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
            <div className={style.connectionOptions}>
                <div className={style.buttonContainer}>
                    {availableTracks.map((t) => {
                        if (t.kind !== 'video') {
                            return null
                        }

                        let trackId = t.id
                        let clientInfo = allClientsInRoom.find((c) =>
                            [c.video_track_id, c.screen_video_track_id].includes(trackId)
                        )
                        if (!clientInfo) {
                            return null
                        }

                        let isScreen = trackId === clientInfo.screen_video_track_id
                        let { display_name } = clientInfo
                        return (
                            <PeerConnectionButton
                                text={`${display_name}'s ${isScreen ? 'Screen' : 'Face'}`}
                                onClick={(e) => {
                                    setCurrentVideoTrackId(trackId)
                                    e.currentTarget.blur()
                                }}
                                isActive={trackId === currentVideoTrackId}
                            />
                        )
                    })}
                </div>
            </div>
            <div className={style.videoContainer}>
                <video ref={ref} id="broadcast-video" />
            </div>
        </div>
    )
})

export default BroadcastVideo
