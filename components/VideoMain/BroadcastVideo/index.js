import React from 'react'
import style from '../../../styles/Components/VideoMain/BroadcastVideo/BroadcastVideo.module.css'
import { PeerConnectionButton } from '../../Buttons'

const BroadcastVideo = React.forwardRef((props, ref) => {
    let { peerConnections, allClientsInRoom } = props
    let tracks = []
    Object.values(peerConnections).forEach((connection) => {
        const receivers = connection.getReceivers()
        if (receivers.length > 0) {
            receivers.forEach((receiver) => tracks.push(receiver.track))
        }
    })
    if (tracks.length > 0) {
        const stream = new MediaStream()
        stream.addTrack(tracks[0])
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
                            if (
                                !clientInfo ||
                                (!clientInfo.is_sharing_video && !clientInfo.is_sharing_screen)
                            ) {
                                return null
                            }
                            const displayName = clientInfo.socket_id

                            return (
                                <React.Fragment key={socketId}>
                                    {clientInfo.is_sharing_video && (
                                        <PeerConnectionButton
                                            text={displayName + "'s Video"}
                                            onClick={() => console.log('video')}
                                        />
                                    )}
                                    {clientInfo.is_sharing_screen && (
                                        <PeerConnectionButton
                                            text={displayName + "'s Screen"}
                                            onClick={() => console.log('screen')}
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
