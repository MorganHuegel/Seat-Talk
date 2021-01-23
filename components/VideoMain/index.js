import React from 'react'
import style from '../../styles/Components/VideoMain/VideoMain.module.css'
import { AudioButton, VideoButton, ShareButton, PeerConnectionButton } from '../Buttons'
import OwnVideo from './OwnVideo'
import BroadcastVideo from './BroadcastVideo'

export default class VideoMain extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            audio_track_id: null,
            video_track_id: null,
            screen_audio_track_id: null,
            screen_video_track_id: null,
            errorMessage: '',
        }
        this.broadcastVideo = React.createRef()
        this.ownVideo = React.createRef()
        this.peerConnections = {}
    }

    componentDidMount() {
        const { socket } = this.props

        socket.on('watcherRequest', async ({ requestingSocketId }) => {
            ////////////////////////////////////
            return //// handle this in onClickVideo
            ////////////////////////////////////

            console.log('received watcher request')
            if (this.state.peerConnections[requestingSocketId]) {
                console.error(
                    'watcherRequest event was fired between two already-existing peer connections.'
                )
            }

            let peerConnection =
                this.state.peerConnections[requestingSocketId] ||
                (await this.createPeerConnection(requestingSocketId))

            const offer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(offer)
            socket.emit('offer', { offer, sendToSocketId: requestingSocketId })

            this.setState({
                peerConnections: Object.assign({}, this.state.peerConnections, {
                    [requestingSocketId]: peerConnection,
                }),
            })
        })

        socket.on('offer', async ({ offer, sentFromSocketId }) => {
            console.log('received offer')
            if (this.peerConnections[sentFromSocketId]) {
                console.error(
                    'offer event was fired between two already-existing peer connections.'
                )
            }

            let peerConnection =
                this.peerConnections[sentFromSocketId] ||
                (await this.createPeerConnection(sentFromSocketId))

            let remoteDescription = new RTCSessionDescription(offer)
            await peerConnection.setRemoteDescription(remoteDescription)
            const sdpAnswer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(sdpAnswer)
            socket.emit('answer', {
                localDescription: peerConnection.localDescription,
                sendToSocketId: sentFromSocketId,
            })
        })

        socket.on('answer', async ({ localDescription, sentFromSocketId }) => {
            console.log('received answer')
            const peerConnection = this.peerConnections[sentFromSocketId]
            let remoteDescription = new RTCSessionDescription(localDescription)
            await peerConnection.setRemoteDescription(remoteDescription)
        })

        socket.on('candidate', async ({ candidate, fromSocketId }) => {
            console.log('received candidate event')
            try {
                const peerConnection = this.peerConnections[fromSocketId]
                if (peerConnection) {
                    let iceCandidate = new RTCIceCandidate(candidate)
                    await peerConnection.addIceCandidate(iceCandidate)
                }
            } catch (e) {
                // will call restartIce() in iceconnectionstatechange
                console.error('caught error adding ICE candidate', e)
            }
        })

        /*
         * WebRTC Resources:
         *  https://gabrieltanner.org/blog/webrtc-video-broadcast
         *  https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity
         *  https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
         */
    }

    createPeerConnection = async (peerSocketId) => {
        const { socket } = this.props

        let peerConnection = new RTCPeerConnection(this.getRTCConfig())
        peerConnection.onicecandidate = (event) => {
            console.log('onicecandidate')
            if (event.candidate) {
                socket.emit('candidate', {
                    sendToSocketId: peerSocketId,
                    candidate: event.candidate,
                })
            }
        }
        peerConnection.oniceconnectionstatechange = (event) => {
            console.log('oniceconnectionstatechange')
            if (peerConnection.iceConnectionState === 'failed') {
                peerConnection.restartIce()
            }
        }
        peerConnection.onnegotiationneeded = async (event) => {
            console.log('onnegotiationneeded')
            this.sendNegotiationOffer(peerConnection, peerSocketId)
        }
        peerConnection.ontrack = async (event) => {
            console.log('onTrack fired', event)
            this.broadcastVideo.current.srcObject = event.streams[0]
            await this.broadcastVideo.current.play()
        }
        peerConnection.onremovetrack = (event) => {
            console.log('onRemoveTrack fired!', event)
        }

        return peerConnection
    }

    sendNegotiationOffer = async (peerConnection, peerSocketId) => {
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        this.props.socket.emit('offer', { offer, sendToSocketId: peerSocketId })
    }

    emitUpdateSharing = () => {
        this.props.socket.emit(
            'updateSharing',
            {
                client_pk: this.props.clientDatabaseId,
                audio_track_id: this.state.audio_track_id,
                video_track_id: this.state.video_track_id,
                screen_audio_track_id: this.state.screen_audio_track_id,
                screen_video_track_id: this.state.screen_video_track_id,
            },
            this.props.roomId
        )
    }

    handleClickVideo = async () => {
        // remove focus so that user doesn't accidently hit ENTER to re-toggle it
        document.getElementById('video-button').blur()

        // if it is currently playing, toggle it OFF
        if (this.state.video_track_id) {
            this.ownVideo.current.srcObject.getVideoTracks().forEach((videoTrack) => {
                videoTrack.stop()
                this.ownVideo.current.srcObject.removeTrack(videoTrack)
            })
            Object.values(this.state.peerConnections).forEach((connection) => {
                const track = connection
                    .getSenders()
                    .find((sender) => sender.track.id === this.state.video_track_id)
                if (track) {
                    connection.removeTrack(track)
                }
            })
            return this.setState({ video_track_id: null, errorMessage: '' }, () => {
                this.emitUpdateSharing()
            })
        }

        // toggling ON
        else {
            // Step 1 - Create RTCPeerConnections (if not there yet)
            this.props.allClientsInRoom.forEach(async (c) => {
                if (!this.peerConnections[c.socket_id] && c.socket_id !== this.props.socket.id) {
                    this.peerConnections[c.socket_id] = await this.createPeerConnection(c.socket_id)
                }
            })

            // Step 2 - Add video to local srcObject
            const mediaDevices = window && window.navigator && window.navigator.mediaDevices
            if (!mediaDevices) {
                return this.setState({
                    video_track_id: null,
                    errorMessage: 'Cannot find media devices to stream video.',
                })
            }
            try {
                const localStream = await mediaDevices.getUserMedia({
                    video: true,
                    audio: !!this.state.audio_track_id,
                })
                this.ownVideo.current.srcObject = localStream
                await this.ownVideo.current.play()
                const localTracks = localStream.getTracks()

                // Step 3 - add each track to each peer connection
                Object.keys(this.peerConnections).forEach((socket_id) => {
                    const pc = this.peerConnections[socket_id]
                    localTracks.forEach((track) => {
                        console.log('pc', pc)
                        pc.addTrack(track, localStream)
                    })
                })

                // step 4 - update allClientsInRoom state
                this.setState({ video_track_id: videoTrack.id }, () => {
                    this.emitUpdateSharing()
                })
            } catch (e) {
                console.error(e)
                let errorMessage = e.message
                if (e instanceof DOMException && errorMessage === 'Permission denied') {
                    errorMessage =
                        'Permission denied to use video media. Please allow this site to use your media. If using Google Chrome, click on Menu -> Settings -> Privacy and Security -> Site Settings'
                }

                return this.setState({
                    video_track_id: null,
                    errorMessage,
                })
            }
        }
    }

    handleClickAudio = async () => {
        // remove focus so that user doesn't accidently hit ENTER to re-toggle it
        document.getElementById('audio-button').blur()

        // if it is currently playing, toggle it OFF
        if (this.state.audio_track_id) {
            Object.values(this.state.peerConnections).forEach((connection) => {
                const track = connection
                    .getSenders()
                    .find((sender) => sender.track.id === this.state.audio_track_id)
                connection.removeTrack(track)
            })
            return this.setState({ audio_track_id: null, errorMessage: '' }, () => {
                this.emitUpdateSharing()
            })
        }

        // toggling ON
        else {
            const mediaDevices = window && window.navigator && window.navigator.mediaDevices
            if (!mediaDevices) {
                return this.setState({
                    audio_track_id: null,
                    errorMessage: 'Cannot find media devices to stream audio.',
                })
            }

            try {
                const stream = await mediaDevices.getUserMedia({
                    video: !!this.state.video_track_id,
                    audio: true,
                })
                const audioTrack = stream.getAudioTracks()[0]
                Object.values(this.state.peerConnections).forEach((connection) => {
                    connection.addTrack(audioTrack)
                })
                this.setState({ audio_track_id: audioTrack.id }, () => {
                    this.emitUpdateSharing()
                })
            } catch (e) {
                let errorMessage = e.message
                if (e instanceof DOMException && errorMessage === 'Permission denied') {
                    errorMessage =
                        'Permission denied to use audio media. Please allow this site to use your media. If using Google Chrome, click on Menu -> Settings -> Privacy and Security -> Site Settings'
                }

                return this.setState({
                    audio_track_id: null,
                    errorMessage,
                })
            }
        }
    }

    handleClickShareScreen = async () => {
        // remove focus so that user doesn't accidently hit ENTER to re-toggle it
        document.getElementById('share-button').blur()

        // if it is currently playing, toggle it OFF
        if (this.state.screen_track_id) {
            Object.values(this.state.peerConnections).forEach((connection) => {
                const track = connection
                    .getSenders()
                    .find((sender) => sender.track.id === this.state.screen_track_id)
                connection.removeTrack(track)
            })
            return this.setState({ screen_track_id: null, errorMessage: '' }, () => {
                this.emitUpdateSharing()
            })
        }

        // toggling ON
        else {
            const mediaDevices = window && window.navigator && window.navigator.mediaDevices
            if (!mediaDevices) {
                return this.setState({
                    screen_track_id: null,
                    errorMessage: 'Cannot find media devices to stream screen.',
                })
            }

            try {
                const stream = await mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100,
                    },
                })
                let videoTrack = stream.getVideoTracks()[0]
                let audioTrack = stream.getAudioTracks()[0]
                Object.values(this.state.peerConnections).forEach((connection) => {
                    if (videoTrack) {
                        connection.addTrack(videoTrack)
                    }
                    if (audioTrack) {
                        connection.addTrack(audioTrack)
                    }
                })
                this.setState(
                    {
                        screen_audio_track_id: audioTrack ? audioTrack.id : null,
                        screen_video_track_id: videoTrack ? videoTrack.id : null,
                    },
                    () => {
                        this.emitUpdateSharing()
                    }
                )
            } catch (e) {
                let errorMessage = e.message
                if (e instanceof DOMException && errorMessage === 'Permission denied') {
                    errorMessage =
                        'Permission denied to share screen. Please allow this site to use your media. If using Google Chrome, click on Menu -> Settings -> Privacy and Security -> Site Settings'
                }

                return this.setState({
                    screen_audio_track_id: null,
                    screen_video_track_id: null,
                    errorMessage,
                })
            }
        }
    }

    getRTCConfig = () => ({
        iceServers: [
            {
                urls: ['stun:stun.l.google.com:19302'],
            },
        ],
    })

    render() {
        const { audio_track_id, video_track_id, screen_video_track_id, errorMessage } = this.state
        const { allClientsInRoom } = this.props

        return (
            <div>
                <BroadcastVideo
                    ref={this.broadcastVideo}
                    peerConnections={this.peerConnections}
                    allClientsInRoom={allClientsInRoom}
                />
                <OwnVideo ref={this.ownVideo} />
                {errorMessage && <p>{errorMessage}</p>}
                <div className={style.buttonContainer}>
                    <AudioButton
                        handleClick={this.handleClickAudio}
                        isStreaming={!!audio_track_id}
                    />
                    <VideoButton
                        handleClick={this.handleClickVideo}
                        isStreaming={!!video_track_id}
                    />
                    <ShareButton
                        handleClick={this.handleClickShareScreen}
                        isStreaming={!!screen_video_track_id}
                    />
                </div>
            </div>
        )
    }
}
