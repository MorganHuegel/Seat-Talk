import React, { useState, useEffect } from 'react'
import style from '../../../styles/Components/VideoMain/BroadcastVideo/BroadcastVideo.module.css'
import { PeerConnectionButton } from '../../Buttons'

const BroadcastVideo = React.forwardRef((props, ref) => {
    let { peerConnections, allClientsInRoom } = props
    let [currentVideoTrackId, setCurrentVideoTrackId] = useState(null)
    useEffect(() => {
        if (!currentVideoTrackId) {
            let defaultConnection = Object.values(peerConnections).find((peerConnection) => {
                return peerConnection
                    .getReceivers()
                    .find((receiver) => receiver.track.kind === 'video')
            })
            console.log(
                'in useEffect',
                defaultConnection &&
                    defaultConnection.getReceivers().find((r) => r.track.kind === 'video')
            )

            if (defaultConnection) {
                setCurrentVideoTrackId(
                    defaultConnection.getReceivers().find((r) => r.track.kind === 'video').track.id
                )
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
    if (tracks.length > 0) {
        tracks.forEach((track) => {
            const stream = ref.current.srcObject || new MediaStream()
            stream.addTrack(track)
            ref.current.srcObject = stream
            ref.current.play()
        })
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
                            // if (
                            //     !clientInfo ||
                            //     (!clientInfo.is_sharing_video && !clientInfo.is_sharing_screen)
                            // ) {
                            //     return null
                            // }
                            const displayName = clientInfo.socket_id

                            let receivers =
                                peerConnections[socketId] &&
                                peerConnections[socketId].getReceivers()
                            // console.log('receivers', receivers)
                            let thisReceiver = receivers.find(
                                (receiver) => receiver.track.kind === 'video'
                            )
                            let videoTrackId =
                                thisReceiver && thisReceiver.track && thisReceiver.track.id

                            return (
                                <React.Fragment key={socketId}>
                                    {true && (
                                        <PeerConnectionButton
                                            text={displayName + "'s Video"}
                                            onClick={(e) => {
                                                setCurrentVideoTrackId(videoTrackId)
                                                e.currentTarget.blur()
                                            }}
                                            isActive={videoTrackId === currentVideoTrackId}
                                        />
                                    )}
                                    {clientInfo.is_sharing_screen && (
                                        <PeerConnectionButton
                                            text={displayName + "'s Screen"}
                                            onClick={(e) => {
                                                setCurrentVideoTrackId(videoTrackId)
                                                e.currentTarget.blur()
                                            }}
                                            isActive={videoTrackId === currentVideoTrackId}
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
