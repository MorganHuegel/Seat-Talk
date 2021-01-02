import React from 'react'

const BroadcastVideo = React.forwardRef((props, ref) => {
    return <video ref={ref} />
})

export default BroadcastVideo
