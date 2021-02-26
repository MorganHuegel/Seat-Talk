import React, { useState } from 'react'
import style from '../../styles/Components/Buttons/Buttons.module.css'
import ReactLoading from 'react-loading'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faMicrophone,
    faVideo,
    faDesktop,
    faClipboard,
    faClipboardCheck,
    faSortDown,
    faSortUp,
} from '@fortawesome/free-solid-svg-icons'
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
                    width="40px"
                    height="45px"
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

const JoinButton = (props) => (
    <button type="button" className={style.joinButton} onClick={props.handleClick}>
        {props.text}
    </button>
)

const CopyButton = (props) => {
    const [isConfirming, setIsConfirming] = useState(false)
    const [isCheckMarkClipboard, setIsCheckmarkClipboard] = useState(false)
    const { copyString } = props

    function handleClick(e) {
        let el = document.getElementById(`copy-${copyString}`)
        el.select()
        el.setSelectionRange(0, 99999) /* For mobile devices */
        document.execCommand('copy')

        e.currentTarget.blur()
        setIsConfirming(true)
        setIsCheckmarkClipboard(true)
        setTimeout(() => setIsConfirming(false), 500)
        setTimeout(() => setIsCheckmarkClipboard(false), 2000)
    }

    return (
        <button
            type="button"
            className={`${style.copyButton} ${isConfirming && style.isConfirming}`}
            onClick={handleClick}
        >
            <FontAwesomeIcon icon={isCheckMarkClipboard ? faClipboardCheck : faClipboard} />
            <span className={style.tooltip}>
                <Tooltip message="Copy Share URL" className={style.bottom} />
            </span>
            <input
                readOnly
                id={`copy-${copyString}`}
                className={style.copyText}
                value={copyString}
            />
        </button>
    )
}

const ParticipantsListButton = (props) => {
    const { allClientsInRoom } = props
    const [isExpanded, setIsExpanded] = useState(false)

    function handleClick(e) {
        setIsExpanded(!isExpanded)
    }

    return (
        <div className={style.participantsList}>
            <button onClick={handleClick}>
                Participants ({allClientsInRoom.length})&nbsp;&nbsp;
                <span className={isExpanded ? style.upArrow : ''}>
                    <FontAwesomeIcon icon={isExpanded ? faSortUp : faSortDown} />
                </span>
            </button>
            <ul
                className={`${style.list} ${isExpanded ? style.isExpanded : ''}`}
                style={{
                    maxHeight: isExpanded
                        ? `${
                              allClientsInRoom.length * 17 + (allClientsInRoom.length - 1) * 14 + 22
                          }px`
                        : '0px',
                }}
            >
                {allClientsInRoom.map((client) => (
                    <li key={client.socket_id}>{client.display_name}</li>
                ))}
            </ul>
        </div>
    )
}

export {
    AudioButton,
    VideoButton,
    ShareButton,
    PeerConnectionButton,
    JoinButton,
    CopyButton,
    ParticipantsListButton,
}
