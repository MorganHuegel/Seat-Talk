import React from 'react'
import style from '../../styles/Components/Buttons/Buttons.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicrophone, faVideo, faDesktop } from '@fortawesome/free-solid-svg-icons'
import Tooltip from '../Tooltip'

const Button = ({ handleClick, isStreaming, icon, tooltip }) => {
    return (
        <button type="button" onClick={handleClick} className={style.button}>
            {!isStreaming && (
                <span className={style.slash}>
                    <span />
                    <span />
                </span>
            )}
            {tooltip && (
                <span className={style.tooltip}>
                    <Tooltip message={tooltip} />
                </span>
            )}
            <span className={style.icon}>
                <FontAwesomeIcon icon={icon} />
            </span>
        </button>
    )
}

const AudioButton = (props) => (
    <Button
        {...props}
        icon={faMicrophone}
        tooltip={props.isStreaming ? 'Mute microphone' : 'Unmute microphone'}
    />
)
const VideoButton = (props) => (
    <Button
        {...props}
        icon={faVideo}
        tooltip={props.isStreaming ? 'Turn off video' : 'Turn on video'}
    />
)
const ShareButton = (props) => (
    <Button
        {...props}
        icon={faDesktop}
        tooltip={props.isStreaming ? 'Stop Sharing' : 'Share Screen'}
    />
)

export { AudioButton, VideoButton, ShareButton }
