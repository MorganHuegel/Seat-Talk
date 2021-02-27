import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import style from '../../../styles/Components/VideoMain/BroadcastVideo/BroadcastVideo.module.css'

const Video = (props) => {
    const videoNode = useRef(null)
    let { client, availableTracks, styles, isScreenShare } = props

    let tracks = availableTracks.filter((t) => {
        if (isScreenShare) {
            return t && t.id && t.id === client.screen_video_track_id
        } else {
            return t && t.id && [client.audio_track_id, client.video_track_id].includes(t.id)
        }
    })

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

    if (videoNode.current && tracks.length) {
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

    return (
        <div className={style.videoContainer} style={styles}>
            <p className={style.displayName}>
                {isScreenShare ? client.display_name + "'s Screen" : client.display_name}
            </p>
            <video ref={videoNode} />
        </div>
    )
}

Video.propTypes = {
    client: PropTypes.object,
    availableTracks: PropTypes.array,
    styles: PropTypes.object,
    isScreenShare: PropTypes.bool,
}

export default Video
