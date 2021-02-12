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
                    {Object.keys(peerConnections)
                        .map((socketId) => {
                            const clientInfo = allClientsInRoom.find(
                                (client) => client.socket_id === socketId
                            )
                            if (!clientInfo) {
                                // peer is probably disconnecting
                                return null
                            }
                            const {
                                video_track_id,
                                screen_video_track_id,
                                display_name,
                            } = clientInfo

                            let receivers =
                                peerConnections[socketId] &&
                                peerConnections[socketId].getReceivers()
                            let isVideoTrackAvailable =
                                video_track_id &&
                                receivers.find(
                                    (r) => r.track.kind === 'video' && r.track.id === video_track_id
                                )

                            let isScreenTrackAvailable =
                                screen_video_track_id &&
                                receivers.find(
                                    (r) =>
                                        r.track.kind === 'video' &&
                                        r.track.id === screen_video_track_id
                                )

                            return (
                                <React.Fragment key={socketId}>
                                    {isVideoTrackAvailable && (
                                        <PeerConnectionButton
                                            text={display_name + "'s Video"}
                                            onClick={(e) => {
                                                setCurrentVideoTrackId(video_track_id)
                                                e.currentTarget.blur()
                                            }}
                                            isActive={video_track_id === currentVideoTrackId}
                                        />
                                    )}
                                    {isScreenTrackAvailable && (
                                        <PeerConnectionButton
                                            text={display_name + "'s Screen"}
                                            onClick={(e) => {
                                                setCurrentVideoTrackId(screen_video_track_id)
                                                e.currentTarget.blur()
                                            }}
                                            isActive={screen_video_track_id === currentVideoTrackId}
                                        />
                                    )}
                                </React.Fragment>
                            )
                        })
                        .filter((x) => x)}
                </div>
            </div>
            <div className={style.videoContainer}>
                <video ref={ref} id="broadcast-video" />
            </div>
        </div>
    )
})

export default BroadcastVideo
