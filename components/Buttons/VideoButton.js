import React from 'react'
import style from '../../styles/Components/Buttons/Buttons.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faVideo, faVideoSlash } from '@fortawesome/free-solid-svg-icons'

const VideoButton = ({ handleClick, isStreaming }) => {
    return (
        <button type="button" onClick={handleClick} className={style.button}>
            <FontAwesomeIcon icon={isStreaming ? faVideo : faVideoSlash} />
        </button>
    )
}

export default VideoButton
