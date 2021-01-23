import React, { useState, useEffect } from 'react'
import style from '../../../styles/Components/VideoMain/BroadcastVideo/BroadcastVideo.module.css'
import { PeerConnectionButton } from '../../Buttons'

const BroadcastVideo = React.forwardRef((props, ref) => {
    let { peerConnections, allClientsInRoom } = props
    let [currentVideoTrackId, setCurrentVideoTrackId] = useState(null)
    useEffect(() => {
        if (ref.current.srcObject) {
            ref.current.srcObject.getVideoTracks().forEach((track) => track.stop())
        }
    }, [currentVideoTrackId])

    function setDefaultVideoTrackId() {
        let defaultConnection = Object.values(peerConnections).find((pc) => {
            return pc.getReceivers().find((receiver) => receiver.track.kind === 'video')
        })

        setCurrentVideoTrackId(
            defaultConnection
                ? defaultConnection.getReceivers().find((r) => r.track.kind === 'video').track.id
                : null
        )
    }

    useEffect(() => {
        if (!currentVideoTrackId) {
            setDefaultVideoTrackId()
        }
        // if there is a currentVideoTrackId, check that the update to peerConnections
        // was not the peer removing the track that this client was watching
        else {
            let peerPlayingCurrentVideo = Object.values(peerConnections).find((pc) => {
                return pc.getReceivers().find((r) => r.track.id === currentVideoTrackId)
            })
            if (!peerPlayingCurrentVideo) {
                setDefaultVideoTrackId()
            }
        }
    }, [peerConnections])

    let tracks = []
    // Push all audio tracks, but only show one video at a time based on currentView
    Object.values(peerConnections).forEach((connection) => {
        const receivers = connection.getReceivers()
        if (receivers.length > 0) {
            receivers.forEach((receiver) => {
                if (receiver.track.kind === 'audio' || receiver.track.id === currentVideoTrackId) {
                    tracks.push(receiver.track)
                }
            })
        }
    })
    console.log('tracks: ', tracks)
    if (tracks.length > 0) {
        const stream = ref.current.srcObject || new MediaStream()
        tracks.forEach((track) => {
            stream.addTrack(track)
        })
        ref.current.srcObject = stream
        ref.current.play()
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
                            const { video_track_id, screen_video_track_id } = clientInfo
                            const displayName = clientInfo.socket_id

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
                                            text={displayName + "'s Video"}
                                            onClick={(e) => {
                                                setCurrentVideoTrackId(video_track_id)
                                                e.currentTarget.blur()
                                            }}
                                            isActive={video_track_id === currentVideoTrackId}
                                        />
                                    )}
                                    {isScreenTrackAvailable && (
                                        <PeerConnectionButton
                                            text={displayName + "'s Screen"}
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
