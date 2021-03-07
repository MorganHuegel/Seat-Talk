import React, { useState } from 'react'
import style from '../../../styles/Components/VideoMain/OwnVideo/OwnVideo.module.css'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faAlignRight,
    faAlignLeft,
    faAlignCenter,
    faMicrophoneAltSlash,
} from '@fortawesome/free-solid-svg-icons'

const OwnVideo = React.forwardRef((props, ref) => {
    const { audio_track_id, video_track_id, display_name } = props
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
                <div className={style.displayName}>
                    <span className={style.displayNameText}>{display_name}</span>
                    {!audio_track_id && (
                        <span className={style.mutedIcon}>
                            &nbsp;
                            <FontAwesomeIcon icon={faMicrophoneAltSlash} />
                        </span>
                    )}
                </div>
                {/* {!video_track_id && (
                    <div className={`${style.windowSize} ${style.avatarContainer}`}>
                        <span
                            className={`${style.noVideoAvatar} ${
                                !audio_track_id ? style.muted : ''
                            }`}
                        >
                            <Image src="/favicon.ico" width="100%" height="100%" />
                        </span>
                    </div>
                )} */}
                <video ref={ref} id="own-video" muted playsInline className={style.windowSize} />
            </div>
        </div>
    )
})

export default OwnVideo
