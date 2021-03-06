import React, { useState } from 'react'
import style from '../../styles/Components/Buttons/Buttons.module.css'
import ReactLoading from 'react-loading'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faMicrophone,
    faVideo,
    faDesktop,
    faClipboard,
    faClipboardCheck,
    faSortDown,
    faSortUp,
    faCode,
    faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons'
import Tooltip from '../Tooltip'

const Button = ({ handleClick, isStreaming, isLoading, isDisabled, icon, tooltip, id }) => {
    return (
        <button
            type="button"
            onClick={handleClick}
            className={`${style.button} ${isStreaming && style.isStreaming}`}
            id={id}
            disabled={isDisabled}
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
    <button type="submit" className={style.joinButton}>
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

const TopBarButton = ({ title, isExpanded, handleClick, isUnviewedChat }) => (
    <button
        onClick={handleClick}
        className={`${style.topBarButton} ${isExpanded ? style.dark : ''}`}
    >
        <span className={isExpanded ? style.underline : ''}>{title}</span>&nbsp;
        <span className={isExpanded ? style.upArrow : style.downArrow}>
            <FontAwesomeIcon icon={isExpanded ? faSortUp : faSortDown} />
        </span>
        {isUnviewedChat && (
            <span className={style.unviewedNotification}>
                <FontAwesomeIcon icon={faExclamationCircle} />
            </span>
        )}
    </button>
)

const ClapButton = ({ handleClick }) => {
    return (
        <button
            type="button"
            className={style.clapButton}
            onClick={(e) => {
                handleClick()
                e.currentTarget.blur()
            }}
        >
            <span className={style.icon}>
                <Image src="/clap.png" width="40px" height="40px" />
            </span>
            <span className={style.tooltip}>
                <Tooltip message="Clap" className={style.bottom} />
            </span>
        </button>
    )
}

const CodeButton = ({ isCode, handleClick }) => {
    return (
        <button
            type="button"
            className={`${style.codeButton} ${isCode ? style.on : ''}`}
            onClick={(e) => {
                handleClick()
                e.currentTarget.blur()
            }}
        >
            <span className="">
                <FontAwesomeIcon icon={faCode} />
            </span>
            <span className={style.tooltip}>
                <Tooltip message="Code" className={style.bottom} />
            </span>
        </button>
    )
}

export {
    AudioButton,
    VideoButton,
    ShareButton,
    PeerConnectionButton,
    JoinButton,
    CopyButton,
    TopBarButton,
    CodeButton,
    ClapButton,
}
