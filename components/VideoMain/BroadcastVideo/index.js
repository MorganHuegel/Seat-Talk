import React from 'react'

const BroadcastVideo = React.forwardRef((props, ref) => {
    let { peerConnections } = props
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
        console.log('ref: ', ref)
        ref.current.srcObject = stream
        ref.current.play()
        // this.broadcastVideo.current.srcObject = stream
        // document.getElementById('broadcast-video').play()
    }
    return <video ref={ref} id="broadcast-video" />
})

export default BroadcastVideo
