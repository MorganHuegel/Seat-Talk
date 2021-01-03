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

            let stream = this.ownVideo.current.srcObject
            stream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, stream)
            })

            let candidates = []
            peerConnection.onicecandidate = (event) => {
                // give time for other peer to create and save PeerConnection in state
                if (event.candidate) {
                    // candidates.push(event.candidate)
                    // setTimeout(() => {
                    //     candidates.forEach((candidate) => {
                    //         socket.emit('candidate', {
                    //             sendToSocketId: requestingSocketId,
                    //             candidate,
                    //         })
                    //     })
                    // }, 1000)
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
            let peerConnections = { ...this.state.peerConnections }
            peerConnections[sentFromSocketId] = peerConnection
            this.setState({ peerConnections }, () => {
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
                    this.broadcastVideo.current.srcObject = event.streams[0]
                }
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
                console.log('added icecandidate', iceCandidate)
            } catch (e) {
                this.setState({ errorMessage: e.message })
            }
        })
        /*
        // https://gabrieltanner.org/blog/webrtc-video-broadcast

        socket.on('watcher', (id) => {
            let peerConnections = {}
            const peerConnection = new RTCPeerConnection(this.getRTCConfig())
            peerConnections[id] = peerConnection

            let stream = video.srcObject
            stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream))

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('candidate', id, event.candidate)
                }
            }

            peerConnection
                .createOffer()
                .then((sdp) => peerConnection.setLocalDescription(sdp))
                .then(() => {
                    socket.emit('offer', id, peerConnection.localDescription)
                })
        })

        socket.on('answer', (id, description) => {
            peerConnections[id].setRemoteDescription(description)
        })

        socket.on('candidate', (id, candidate) => {
            peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate))
        })
        // when joining, see if there are media already being shared
        socket.emit('watcher')
        // then listen for future media
        socket.on('broadcaster', () => {
            socket.emit('watcher')
        })
        socket.on('offer', (id, description) => {
            const peerConnection = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: ['stun:stun.l.google.com:19302'],
                    },
                ],
            })
            this.peerConnection
                .setRemoteDescription(description)
                .then(() => this.peerConnection.createAnswer())
                .then((sdp) => this.peerConnection.setLocalDescription(sdp))
                .then(() => {
                    socket.emit('answer', id, this.peerConnection.localDescription)
                })
            this.peerConnection.ontrack = (event) => {
                video.srcObject = event.streams[0]
            }
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('candidate', id, event.candidate)
                }
            }
        })
        socket.on('candidate', (id, candidate) => {
            peerConnection
                .addIceCandidate(new RTCIceCandidate(candidate))
                .catch((e) => console.error(e))
        })
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
        let tracks = []
        Object.values(peerConnections).forEach((connection) => {
            const receivers = connection.getReceivers()
            if (receivers.length > 0) {
                receivers.forEach((receiver) => tracks.push(receiver.track))
            }
        })
        if (tracks.length > 0) {
            const stream = new MediaStream()
            stream.addTrack(tracks[0])
            this.broadcastVideo.current.srcObject = stream
        }

        return (
            <div>
                <BroadcastVideo ref={this.broadcastVideo} />
                <OwnVideo ref={this.ownVideo} />
                <button
                    onClick={() => {
                        console.log(this.broadcastVideo.current.srcObject.getTracks())
                    }}
                >
                    Show Tracks
                </button>
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
