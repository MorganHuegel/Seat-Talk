import React from 'react'
import style from '../../styles/Components/Buttons/Buttons.module.css'
import ReactLoading from 'react-loading'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicrophone, faVideo, faDesktop } from '@fortawesome/free-solid-svg-icons'
import Tooltip from '../Tooltip'

const Button = ({ handleClick, isStreaming, isLoading, icon, tooltip, id }) => {
    return (
        <button
            type="button"
            onClick={handleClick}
            className={`${style.button} ${isStreaming && style.isStreaming}`}
            id={id}
            disabled={isLoading}
        >
            {!isStreaming && !isLoading && (
                <span className={style.slash}>
                    <span />
                    <span />
                </span>
            )}
            {isLoading && (
                <ReactLoading
                    type="bubbles"
                    color="rgba(255, 0, 0, 0.5)"
                    width="60px"
                    height="60px"
                    className={style.loadingBubbles}
                />
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
        id="audio-button"
    />
)
const VideoButton = (props) => (
    <Button
        {...props}
        icon={faVideo}
        tooltip={props.isStreaming ? 'Turn off video' : 'Turn on video'}
        id="video-button"
    />
)
const ShareButton = (props) => (
    <Button
        {...props}
        icon={faDesktop}
        tooltip={props.isStreaming ? 'Stop Sharing' : 'Share Screen'}
        id="share-button"
    />
)

const PeerConnectionButton = (props) => (
    <button
        type="button"
        onClick={props.onClick}
        className={`${style.peerConnectionButton} ${props.isActive && style.active}`}
    >
        {props.text}
    </button>
)

export { AudioButton, VideoButton, ShareButton, PeerConnectionButton }
