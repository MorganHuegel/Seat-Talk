import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import style from '../../../styles/Components/VideoMain/BroadcastVideo/BroadcastVideo.module.css'
import Video from './Video'

const BroadcastVideo = (props) => {
    const { otherClientsInRoom, availableTracks } = props
    const [windowWidth, setWindowWidth] = useState(window.innerWidth)
    useEffect(() => {
        function handleResize(e) {
            setWindowWidth(e.currentTarget.innerWidth)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    })

    let clientCount = otherClientsInRoom.length
    let styles
    if (clientCount <= 1) {
        styles = { width: '100%', height: '100%' }
    } else if (clientCount <= 2) {
        styles = { width: '100%', height: '50%' }
    } else if (clientCount <= 4) {
        styles = { width: '50%', height: '50%' }
    } else if (windowWidth > 1200) {
        styles = { width: '25%', height: '33.33%' }
    } else if (windowWidth > 900) {
        styles = { width: '33.33%', height: '33.33%' }
    } else {
        styles = { width: '50%', height: '33.33%' }
    }

    return (
        <div className={style.broadcastVideoContainer}>
            {otherClientsInRoom.length > 0 ? (
                otherClientsInRoom.map((c) => (
                    <Video
                        client={c}
                        availableTracks={availableTracks}
                        styles={styles}
                        key={c.socket_id}
                    />
                ))
            ) : (
                <div className={style.emptyRoomMessage}>
                    <p>Share this url for other people to join:</p>
                    <p>{window.location.href}</p>
                </div>
            )}
        </div>
    )
}

BroadcastVideo.propTypes = {
    otherClientsInRoom: PropTypes.array,
    availableTracks: PropTypes.array,
}

export default BroadcastVideo
