import React from 'react'
import style from '../../styles/Components/VideoMain/VideoMain.module.css'
import { AudioButton, VideoButton, ShareButton } from '../Buttons'
import OwnVideo from './OwnVideo'
import BroadcastVideo from './BroadcastVideo'

export default class VideoMain extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isSharingVideo: false,
            isSharingAudio: false,
            isSharingScreen: false,
            peerConnections: {},
            errorMessage: '',
        }
        this.broadcastVideo = React.createRef()
        this.ownVideo = React.createRef()
    }

    componentDidMount() {
        const { socket, clientDatabaseId, roomId } = this.props
        socket.on('watcherRequest', async ({ requestingSocketId }) => {
            const { isSharingAudio, isSharingScreen, isSharingVideo } = this.state
            if (!isSharingVideo && !isSharingAudio && !isSharingScreen) {
                return
            }

            const peerConnection = new RTCPeerConnection(this.getRTCConfig())
            peerConnection.addEventListener('iceconnectionstatechange', (event) => {
                if (peerConnection.iceConnectionState === 'failed') {
                    peerConnection.restartIce()
                }
            })

            let stream = this.ownVideo.current.srcObject
            stream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, stream)
            })

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('candidate', {
                        sendToSocketId: requestingSocketId,
                        candidate: event.candidate,
                    })
                }
            }

            const offer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(offer)

            let peerConnections = { ...this.state.peerConnections }
            peerConnections[requestingSocketId] = peerConnection
            this.setState({ peerConnections }, () => {
                socket.emit('offer', { offer, sendToSocketId: requestingSocketId })
            })
        })
        socket.on('offer', async ({ offer, sentFromSocketId }) => {
            const peerConnection = new RTCPeerConnection(this.getRTCConfig())
            await peerConnection.setRemoteDescription(offer)
            const sdpAnswer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(sdpAnswer)
            peerConnection.addEventListener('iceconnectionstatechange', (event) => {
                if (peerConnection.iceConnectionState === 'failed') {
                    peerConnection.restartIce()
                }
            })
            let peerConnections = { ...this.state.peerConnections }
            peerConnections[sentFromSocketId] = peerConnection
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('candidate', {
                        sendToSocketId: sentFromSocketId,
                        candidate: event.candidate,
                    })
                }
            }
            peerConnection.ontrack = (event) => {
                console.log('ontrack fired!: ', event)
                // this.broadcastVideo.current.srcObject = event.streams[0]
                // this.broadcastVideo.play()
            }
            this.setState({ peerConnections }, () => {
                socket.emit('answer', {
                    localDescription: peerConnection.localDescription,
                    sendToSocketId: sentFromSocketId,
                })
            })
        })
        socket.on('answer', async ({ localDescription, sentFromSocketId }) => {
            let peerConnections = { ...this.state.peerConnections }
            await peerConnections[sentFromSocketId].setRemoteDescription(localDescription)
            this.setState({ peerConnections })
        })
        socket.on('candidate', async ({ candidate, fromSocketId }) => {
            try {
                let iceCandidate = new RTCIceCandidate(candidate)
                let peerConnections = { ...this.state.peerConnections }
                await peerConnections[fromSocketId].addIceCandidate(iceCandidate)
            } catch (e) {
                // will call restartIce() in iceconnectionstatechange
            }
        })

        /*
         * WebRTC Resources:
         *  https://gabrieltanner.org/blog/webrtc-video-broadcast
         *  https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity
         */
    }

    emitUpdateSharing = () => {
        this.props.socket.emit('updateSharing', {
            client_pk: this.props.clientDatabaseId,
            is_sharing_video: this.state.isSharingVideo,
            is_sharing_audio: this.state.isSharingAudio,
            is_sharing_screen: this.state.isSharingScreen,
        })
    }

    handleClickVideo = () => {
        // remove focus so that user doesn't accidently hit ENTER to re-toggle it
        document.getElementById('video-button').blur()

        // if it is currently playing, toggle it OFF
        if (this.state.isSharingVideo) {
            this.ownVideo.current.srcObject.getVideoTracks().forEach((mediaTrack) => {
                mediaTrack.stop()
                this.ownVideo.current.srcObject.removeTrack(mediaTrack)
            })
            return this.setState({ isSharingVideo: false, errorMessage: '' }, () => {
                this.emitUpdateSharing()
            })
        }

        // toggling ON
        else {
            this.setState({ isSharingVideo: true, errorMessage: '' }, async () => {
                const mediaDevices = window && window.navigator && window.navigator.mediaDevices
                if (!mediaDevices) {
                    return this.setState({
                        isSharingVideo: false,
                        errorMessage: 'Cannot find media devices to stream video.',
                    })
                }

                try {
                    const stream = await mediaDevices.getUserMedia(this.getUserMediaConstraints())
                    this.ownVideo.current.srcObject = stream
                    this.ownVideo.current.play()
                    this.emitUpdateSharing()
                } catch (e) {
                    let errorMessage = e.message
                    if (e instanceof DOMException && errorMessage === 'Permission denied') {
                        errorMessage =
                            'Permission denied to use video media. Please allow this site to use your media. If using Google Chrome, click on Menu -> Settings -> Privacy and Security -> Site Settings'
                    }

                    return this.setState({
                        isSharingVideo: false,
                        errorMessage,
                    })
                }
            })
        }
    }

    handleClickAudio = () => {
        // remove focus so that user doesn't accidently hit ENTER to re-toggle it
        document.getElementById('audio-button').blur()

        // if it is currently playing, toggle it OFF
        if (this.state.isSharingAudio) {
            this.ownVideo.current.srcObject.getAudioTracks().forEach((mediaTrack) => {
                mediaTrack.stop()
                this.ownVideo.current.srcObject.removeTrack(mediaTrack)
            })

            return this.setState({ isSharingAudio: false, errorMessage: '' }, () => {
                this.emitUpdateSharing()
            })
        }

        // toggling ON
        else {
            this.setState({ isSharingAudio: true, errorMessage: '' }, async () => {
                const mediaDevices = window && window.navigator && window.navigator.mediaDevices
                if (!mediaDevices) {
                    return this.setState({
                        isSharingAudio: false,
                        errorMessage: 'Cannot find media devices to stream audio.',
                    })
                }

                try {
                    const stream = await mediaDevices.getUserMedia(this.getUserMediaConstraints())
                    this.ownVideo.current.srcObject = stream
                    this.ownVideo.current.play()
                    this.emitUpdateSharing()
                } catch (e) {
                    let errorMessage = e.message
                    if (e instanceof DOMException && errorMessage === 'Permission denied') {
                        errorMessage =
                            'Permission denied to use audio media. Please allow this site to use your media. If using Google Chrome, click on Menu -> Settings -> Privacy and Security -> Site Settings'
                    }

                    return this.setState({
                        isSharingAudio: false,
                        errorMessage,
                    })
                }
            })
        }
    }

    handleClickShareScreen = () => {}

    getUserMediaConstraints = () => ({
        video: this.state.isSharingVideo,
        audio: this.state.isSharingAudio,
    })

    getRTCConfig = () => ({
        iceServers: [
            {
                urls: ['stun:stun.l.google.com:19302'],
            },
        ],
    })

    render() {
        const {
            isSharingAudio,
            isSharingVideo,
            isSharingScreen,
            errorMessage,
            peerConnections,
        } = this.state
        const { allClientsInRoom } = this.props

        return (
            <div>
                <BroadcastVideo
                    ref={this.broadcastVideo}
                    peerConnections={peerConnections}
                    allClientsInRoom={allClientsInRoom}
                />
                <OwnVideo ref={this.ownVideo} />
                {errorMessage && <p>{errorMessage}</p>}
                <div className={style.buttonContainer}>
                    <AudioButton handleClick={this.handleClickAudio} isStreaming={isSharingAudio} />
                    <VideoButton handleClick={this.handleClickVideo} isStreaming={isSharingVideo} />
                    <ShareButton
                        handleClick={this.handleClickShareScreen}
                        isStreaming={isSharingScreen}
                    />
                </div>
            </div>
        )
    }
}
