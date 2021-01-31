import React, { useState } from 'react'
import style from '../../../styles/Components/VideoMain/OwnVideo/OwnVideo.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAlignRight, faAlignLeft, faAlignCenter } from '@fortawesome/free-solid-svg-icons'

const OwnVideo = React.forwardRef((props, ref) => {
    const screenWidth = window.innerWidth
    const [justifyVideo, setJustifyVideo] = useState(screenWidth < 500 ? 'flex-start' : 'center')

    return (
        <div className={style.videoContainer} style={{ justifyContent: justifyVideo }}>
            <div className={style.videoPlayer}>
                <div className={style.alignButtonContainer}>
                    <button type="button" onClick={() => setJustifyVideo('flex-start')}>
                        <FontAwesomeIcon icon={faAlignLeft} />
                    </button>
                    <button type="button" onClick={() => setJustifyVideo('center')}>
                        <FontAwesomeIcon icon={faAlignCenter} />
                    </button>
                    <button type="button" onClick={() => setJustifyVideo('flex-end')}>
                        <FontAwesomeIcon icon={faAlignRight} />
                    </button>
                </div>
                <video ref={ref} id="own-video" muted />
            </div>
        </div>
    )
})

export default OwnVideo
