import React from 'react'
import style from '../../styles/Components/Buttons/Buttons.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons'

const AudioButton = ({ handleClick, isStreaming }) => {
    return (
        <button type="button" onClick={handleClick} className={style.button}>
            <FontAwesomeIcon icon={isStreaming ? faMicrophone : faMicrophoneSlash} />
        </button>
    )
}

export default AudioButton
