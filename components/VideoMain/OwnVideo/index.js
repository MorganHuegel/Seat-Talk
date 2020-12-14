import React from 'react'
import style from '../../../styles/Components/VideoMain/OwnVideo/OwnVideo.module.css'

const OwnVideo = React.forwardRef((props, ref) => {
    return (
        <div className={style.videoContainer}>
            <video ref={ref} />
        </div>
    )
})

export default OwnVideo
