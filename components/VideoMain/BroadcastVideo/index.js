import React, { useState, useEffect, Fragment } from 'react'
import PropTypes from 'prop-types'
import style from '../../../styles/Components/VideoMain/BroadcastVideo/BroadcastVideo.module.css'
import Video from './Video'

const BroadcastVideo = (props) => {
    const { otherClientsInRoom } = props
    otherClientsInRoom.sort((a, b) => {
        // shared screen goes at the top
        if (b.screenVideoTrack && !a.screenVideoTrack) {
            return 1
        } else if (!b.screenVideoTrack && a.screenVideoTrack) {
            return -1
        } else {
            // video sharing comes next
            if (b.videoTrack && !a.videoTrack) {
                return 1
            } else if (!b.videoTrack && a.videoTrack) {
                return -1
            } else {
                // audio sharing comes next
                if (b.audioTrack && !a.audioTrack) {
                    return 1
                } else if (!b.audioTrack && a.audioTrack) {
                    return -1
                }
                // finally, just sort by id (order joined)
                else {
                    return a.id - b.id
                }
            }
        }
    })

    const [windowWidth, setWindowWidth] = useState(window.innerWidth)
    const [currentVideoTrackId, setCurrentVideoTrackId] = useState(null)

    useEffect(() => {
        function handleResize(e) {
            let newWidth = e.currentTarget.innerWidth
            if (
                (newWidth < 1200 && windowWidth > 1200) ||
                (newWidth > 1200 && windowWidth < 1200) ||
                (newWidth < 900 && windowWidth > 900) ||
                (newWidth > 900 && windowWidth < 900)
            ) {
                setWindowWidth(e.currentTarget.innerWidth)
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    })

    function handleClickVideo(trackId) {
        if (otherClientsInRoom.length > 1) {
            setCurrentVideoTrackId(trackId)
        } else if (otherClientsInRoom.length === 1 && otherClientsInRoom[0].screenVideoTrack) {
            setCurrentVideoTrackId(trackId)
        }
    }

    useEffect(() => {
        if (
            currentVideoTrackId &&
            !props.otherClientsInRoom.some((c) => {
                return (
                    (c.videoTrack && c.videoTrack.id === currentVideoTrackId) ||
                    (c.screenVideoTrack && c.screenVideoTrack.id === currentVideoTrackId)
                )
            })
        ) {
            setCurrentVideoTrackId(null)
        }
    }, [props.otherClientsInRoom])

    let clientCount = otherClientsInRoom.reduce(
        (acc, client) => (client.screenVideoTrack ? acc + 2 : acc + 1),
        0
    )

    let styles
    if (clientCount <= 1) {
        styles = { width: '100%', height: '100%' }
    } else if (windowWidth > 1200) {
        if (clientCount === 2) {
            styles = { width: '50%', height: '100%' }
        } else if (clientCount === 3) {
            styles = { width: '33%', height: '100%' }
        } else if (clientCount === 4) {
            styles = { width: '50%', height: '50%' }
        } else if (clientCount <= 8) {
            styles = { width: '25%', height: '50%' }
        } else {
            styles = { width: '25%', height: '33.33%' }
        }
    } else if (windowWidth > 900) {
        if (clientCount === 2) {
            styles = { width: '50%', height: '100%' }
        } else if (clientCount <= 4) {
            styles = { width: '50%', height: '50%' }
        } else {
            styles = { width: '50%', height: '33.33%' }
        }
    } else {
        if (clientCount === 2) {
            styles = { width: '100%', height: '50%' }
        } else if (clientCount <= 4) {
            styles = { width: '50%', height: '50%' }
        } else {
            styles = { width: '50%', height: '33.33%' }
        }
    }

    let fullScreenVideo
    let fullScreenClient = otherClientsInRoom.find(
        (c) =>
            (c.screenVideoTrack && c.screenVideoTrack.id === currentVideoTrackId) ||
            (c.videoTrack && c.videoTrack.id === currentVideoTrackId)
    )
    if (currentVideoTrackId && fullScreenClient) {
        let isScreenShare =
            fullScreenClient.screenVideoTrack &&
            fullScreenClient.screenVideoTrack.id === currentVideoTrackId
        fullScreenVideo = (
            <Video
                client={fullScreenClient}
                styles={{ width: '100%', height: '100%' }}
                key={'fullscreen' + fullScreenClient.socket_id}
                handleClick={() => handleClickVideo(null)}
                isScreenShare={isScreenShare}
            />
        )
    }

    return (
        <div className={style.broadcastVideoContainer}>
            {fullScreenVideo}
            {otherClientsInRoom.length > 0 ? (
                otherClientsInRoom.map((c) => (
                    <Fragment key={c.socket_id}>
                        {!!c.screenVideoTrack && currentVideoTrackId !== c.screenVideoTrack.id && (
                            <Video
                                client={c}
                                styles={styles}
                                isScreenShare
                                handleClick={() => handleClickVideo(c.screenVideoTrack.id)}
                            />
                        )}
                        {(!c.videoTrack || currentVideoTrackId !== c.videoTrack.id) && (
                            <Video
                                client={c}
                                styles={styles}
                                handleClick={() =>
                                    handleClickVideo(c.videoTrack ? c.videoTrack.id : null)
                                }
                            />
                        )}
                    </Fragment>
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
    otherClientsInRoom: PropTypes.array.isRequired,
}

export default BroadcastVideo
