import React, { useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicrophoneAltSlash } from '@fortawesome/free-solid-svg-icons'
import Image from 'next/image'
import style from '../../../styles/Components/VideoMain/BroadcastVideo/BroadcastVideo.module.css'

const Video = (props) => {
    const videoNode = useRef(null)
    let { client, styles, isScreenShare, handleClick } = props
    let [tracks, setTracks] = useState([])

    useEffect(() => {
        let newTracks = isScreenShare
            ? [client.screenVideoTrack]
            : [client.videoTrack, client.audioTrack]
        setTracks(newTracks.filter((t) => t)) // remove null's
    }, [client])

    async function addTracks() {
        const stream = new MediaStream()
        tracks.forEach((t) => {
            stream.addTrack(t)
        })
        videoNode.current.srcObject = stream
        if (videoNode.current.paused) {
            await videoNode.current.play()
        }
    }

    if (videoNode && videoNode.current && tracks.length) {
        addTracks()
    }

    if (
        videoNode.current &&
        videoNode.current.srcObject &&
        videoNode.current.srcObject.getTracks().length > tracks.length
    ) {
        let currTracks = videoNode.current.srcObject.getTracks()
        currTracks.forEach((currTr) => {
            if (!tracks.find((tr) => tr.id === currTr.id)) {
                currTr.stop()
                videoNode.current.srcObject.removeTrack(currTr)
            }
        })
    }

    let isMuted = !isScreenShare && !tracks.find((t) => t.kind === 'audio')
    let isNoVideo = !isScreenShare && !tracks.find((t) => t.kind === 'video')

    return (
        <div
            className={`${style.videoContainer} ${isNoVideo ? '' : style.clickable}`}
            style={styles}
            onClick={handleClick}
        >
            <p className={style.displayName}>
                {isScreenShare ? client.displayName + "'s Screen" : client.displayName}
                {isMuted && (
                    <span className={style.mutedIcon}>
                        &nbsp;
                        <FontAwesomeIcon icon={faMicrophoneAltSlash} />
                    </span>
                )}
            </p>
            <video ref={videoNode} playsInline />
            {isNoVideo && (
                <span className={`${style.noVideoAvatar} ${isMuted ? style.muted : ''}`}>
                    <Image src="/favicon.ico" width="100%" height="100%" />
                </span>
            )}
        </div>
    )
}

Video.propTypes = {
    client: PropTypes.object.isRequired,
    styles: PropTypes.object,
    isScreenShare: PropTypes.bool,
}

export default Video
