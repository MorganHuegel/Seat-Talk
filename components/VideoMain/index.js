import React from 'react'
import PropTypes from 'prop-types'
import style from '../../styles/Components/VideoMain/VideoMain.module.css'
import {
    AudioButton,
    VideoButton,
    ShareButton,
    ParticipantsListButton,
    CopyButton,
} from '../Buttons'
import OwnVideo from './OwnVideo'
import BroadcastVideo from './BroadcastVideo'

const initializeMapper = {
    audioTrack: null,
    videoTrack: null,
    screenTrack: null,
    isExpectingAudio: false,
    isExpectingVideo: false,
    isExpectingScreen: false,
}

export default class VideoMain extends React.Component {
    static propTypes = {
        allClientsInRoom: PropTypes.array,
        socket: PropTypes.object,
    }

    constructor(props) {
        super(props)
        this.state = {
            // loading state on buttons
            is_audio_loading: false,
            is_video_loading: false,
            is_screen_share_loading: false,

            audio_track_id: null,
            video_track_id: null,
            screen_audio_track_id: null,
            screen_video_track_id: null,
            errorMessage: '',
            peerConnectionTrackMapper: {},
        }

        this.ownVideo = React.createRef()
        this.ownScreenVideo = React.createRef()
        this.peerConnections = {}
        this.unexpectedTracks = {}
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.allClientsInRoom !== this.props.allClientsInRoom) {
            // if allClientsInRoom changes, check that one of the clients didn't leave the room
            if (prevProps.allClientsInRoom.length > this.props.allClientsInRoom.length) {
                let clientWhoLeft = prevProps.allClientsInRoom.find(
                    (client) =>
                        !this.props.allClientsInRoom.find((c) => c.socket_id === client.socket_id)
                )

                const peerConnectionTrackMapper = { ...this.state.peerConnectionTrackMapper }
                delete peerConnectionTrackMapper[clientWhoLeft.socket_id]

                return this.setState({
                    peerConnectionTrackMapper,
                })
            }

            // if someone was just added, don't do anything special
            if (prevProps.allClientsInRoom.length < this.props.allClientsInRoom.length) {
                return
            }

            // if someone updates their sharing, set the track mapper to expect their track
            let clientToggledTrack = this.props.allClientsInRoom.find((client) => {
                return (
                    client.socket_id !== this.props.socket.id &&
                    prevProps.allClientsInRoom.find((prevClient) => {
                        return (
                            prevClient.socket_id === client.socket_id &&
                            (client.audio_track_id !== prevClient.audio_track_id ||
                                client.video_track_id !== prevClient.video_track_id ||
                                client.screen_audio_track_id !== prevClient.screen_audio_track_id ||
                                client.screen_video_track_id !== prevClient.screen_video_track_id)
                        )
                    })
                )
            })
            if (clientToggledTrack) {
                const prevClient = prevProps.allClientsInRoom.find(
                    (c) => c.socket_id === clientToggledTrack.socket_id
                )

                const newPcTrackMap = this.state.peerConnectionTrackMapper[
                    clientToggledTrack.socket_id
                ]
                    ? {
                          ...this.state.peerConnectionTrackMapper[clientToggledTrack.socket_id],
                      }
                    : { ...initializeMapper }

                const isToggledOff =
                    (prevClient.video_track_id && !clientToggledTrack.video_track_id) ||
                    (prevClient.audio_track_id && !clientToggledTrack.audio_track_id) ||
                    (prevClient.screen_video_track_id && !clientToggledTrack.screen_video_track_id)

                /* Expecting new audio track when:
                      1. audio toggled off to on
                      2. audio is already on and video toggled off to on (restarts userMedia)
                      3. audio is already on and video toggled on to off (restarts userMedia)
                */
                newPcTrackMap.isExpectingAudio =
                    (!prevClient.audio_track_id && !!clientToggledTrack.audio_track_id) ||
                    (!!prevClient.audio_track_id &&
                        !prevClient.video_track_id &&
                        !!clientToggledTrack.audio_track_id &&
                        !!clientToggledTrack.video_track_id) ||
                    (!!prevClient.audio_track_id &&
                        !!prevClient.video_track_id &&
                        !!clientToggledTrack.audio_track_id &&
                        !clientToggledTrack.video_track_id)

                /* Expecting new video track when:
                      1. video toggled off to on
                      2. video is already on and audio toggled off to on (restart userMedia)
                */
                newPcTrackMap.isExpectingVideo =
                    (!prevClient.video_track_id && !!clientToggledTrack.video_track_id) ||
                    (!!prevClient.video_track_id &&
                        !prevClient.audio_track_id &&
                        !!clientToggledTrack.audio_track_id &&
                        !!clientToggledTrack.video_track_id)

                /* Expecting new video track when:
                      1. screen share toggled off to on
                */
                newPcTrackMap.isExpectingScreen =
                    !prevClient.screen_video_track_id && !!clientToggledTrack.screen_video_track_id

                if (isToggledOff) {
                    newPcTrackMap.audioTrack = clientToggledTrack.audio_track_id
                        ? newPcTrackMap.audioTrack
                        : null
                    newPcTrackMap.videoTrack = clientToggledTrack.video_track_id
                        ? newPcTrackMap.videoTrack
                        : null
                    newPcTrackMap.screenTrack = clientToggledTrack.screen_video_track_id
                        ? newPcTrackMap.screenTrack
                        : null
                }

                // final check to see if track is sitting in waiting room already
                let unexpectedTracks = this.unexpectedTracks[clientToggledTrack.socket_id]
                if (
                    unexpectedTracks &&
                    (unexpectedTracks.audioTrack || unexpectedTracks.videoTrack)
                ) {
                    if (
                        newPcTrackMap.isExpectingAudio &&
                        unexpectedTracks &&
                        unexpectedTracks.audioTrack
                    ) {
                        newPcTrackMap.isExpectingAudio = false
                        newPcTrackMap.audioTrack = unexpectedTracks.audioTrack
                        this.unexpectedTracks[clientToggledTrack.socket_id].audioTrack = null
                    }

                    if (
                        newPcTrackMap.isExpectingVideo &&
                        unexpectedTracks &&
                        unexpectedTracks.videoTrack
                    ) {
                        newPcTrackMap.isExpectingVideo = false
                        newPcTrackMap.videoTrack = unexpectedTracks.videoTrack
                        this.unexpectedTracks[clientToggledTrack.socket_id].videoTrack = null
                    } else if (
                        newPcTrackMap.isExpectingScreen &&
                        unexpectedTracks &&
                        unexpectedTracks.videoTrack
                    ) {
                        newPcTrackMap.isExpectingScreen = false
                        newPcTrackMap.screenTrack = unexpectedTracks.videoTrack
                        this.unexpectedTracks[clientToggledTrack.socket_id].videoTrack = null
                    }

                    if (
                        !newPcTrackMap.audioTrack &&
                        !newPcTrackMap.videoTrack &&
                        !newPcTrackMap.screenTrack
                    ) {
                        console.error(
                            'Found track in unexpectedTracks for ' +
                                clientToggledTrack.display_name +
                                ', but could not add it to track mapper.'
                        )
                        this.unexpectedTracks[clientToggledTrack.socket_id] = {
                            audioTrack: null,
                            videoTrack: null,
                        }
                    }
                }

                const peerConnectionTrackMapper = { ...this.state.peerConnectionTrackMapper }
                peerConnectionTrackMapper[clientToggledTrack.socket_id] = newPcTrackMap
                this.setState({ peerConnectionTrackMapper })
            }
        }
    }

    componentDidMount() {
        const { socket } = this.props

        socket.on('watcherRequest', async ({ requestingSocketId }) => {
            let {
                audio_track_id,
                video_track_id,
                screen_audio_track_id,
                screen_video_track_id,
            } = this.state
            if (
                !audio_track_id &&
                !video_track_id &&
                !screen_audio_track_id &&
                !screen_video_track_id
            ) {
                return
            }

            if (this.peerConnections[requestingSocketId]) {
                console.error(
                    'watcherRequest event was fired between two already-existing peer connections.'
                )
            }

            const peerConnection = await this.createPeerConnection(requestingSocketId)
            if (video_track_id || audio_track_id) {
                const stream = this.ownVideo.current.srcObject
                if (stream) {
                    const videoTrack = stream.getVideoTracks()[0]
                    if (videoTrack) {
                        peerConnection.addTrack(videoTrack, stream)
                    }
                    const audioTrack = stream.getAudioTracks()[0]
                    if (audioTrack) {
                        peerConnection.addTrack(audioTrack, stream)
                    }
                }
            }

            if (screen_video_track_id || screen_audio_track_id) {
                const stream = this.ownScreenVideo.current.srcObject
                stream.getTracks().forEach((t) => peerConnection.addTrack(t))
            }

            this.peerConnections[requestingSocketId] = peerConnection
        })

        socket.on('offer', async ({ offer, sentFromSocketId }) => {
            let peerConnection =
                this.peerConnections[sentFromSocketId] ||
                (await this.createPeerConnection(sentFromSocketId))

            let remoteDescription = new RTCSessionDescription(offer)
            await peerConnection.setRemoteDescription(remoteDescription)
            const sdpAnswer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(sdpAnswer)

            this.peerConnections[sentFromSocketId] = peerConnection

            socket.emit('answer', {
                localDescription: peerConnection.localDescription,
                sendToSocketId: sentFromSocketId,
            })
        })

        socket.on('answer', async ({ localDescription, sentFromSocketId }) => {
            const peerConnection = this.peerConnections[sentFromSocketId]
            let remoteDescription = new RTCSessionDescription(localDescription)
            await peerConnection.setRemoteDescription(remoteDescription)
        })

        socket.on('candidate', async ({ candidate, fromSocketId }) => {
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
    }

    componentWillUnmount() {
        Object.values(this.peerConnections).forEach((pc) => {
            const senders = pc.getSenders()
            if (senders.length) {
                senders.forEach((sender) => {
                    if (sender.track) {
                        sender.track.stop()
                    }
                    pc.removeTrack(sender)
                })
            }

            pc.close()
        })
    }

    createPeerConnection = async (peerSocketId) => {
        const { socket } = this.props

        let peerConnection = new RTCPeerConnection(this.getRTCConfig())
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', {
                    sendToSocketId: peerSocketId,
                    candidate: event.candidate,
                })
            }
        }
        peerConnection.oniceconnectionstatechange = (event) => {
            if (peerConnection.iceConnectionState === 'failed') {
                peerConnection.restartIce()
            }
        }
        peerConnection.onnegotiationneeded = async (event) => {
            this.sendNegotiationOffer(peerConnection, peerSocketId)
        }
        peerConnection.ontrack = async (event) => {
            if (!this.state.peerConnectionTrackMapper[peerSocketId]) {
                console.error(`
                    ontrack fired, but peerConnectionTrackMapper has not yet 
                    been created for this socket ID: ${peerSocketId}
                `)
                return
            }
            let pcMapper = { ...this.state.peerConnectionTrackMapper[peerSocketId] }
            let newTrack = event.track

            // maybe we can discern which track it is by allClientsInRoom
            let clientData = this.props.allClientsInRoom.find((c) => c.socket_id === peerSocketId)
            if (
                (pcMapper.isExpectingAudio && newTrack.kind === 'audio') ||
                newTrack.id === clientData.audio_track_id
            ) {
                pcMapper.audioTrack = newTrack
                pcMapper.isExpectingAudio = false
            } else if (
                (pcMapper.isExpectingVideo && newTrack.kind === 'video') ||
                newTrack.id === clientData.video_track_id
            ) {
                pcMapper.videoTrack = newTrack
                pcMapper.isExpectingVideo = false
            } else if (
                (pcMapper.isExpectingScreen && newTrack.kind === 'video') ||
                newTrack.id === clientData.screen_video_track_id
            ) {
                pcMapper.screenTrack = newTrack
                pcMapper.isExpectingScreen = false
            } else {
                console.error(
                    'ontrack fired before allClientsInRoom was updated. ' +
                        'Saving track in unexpectedTracks for when it does update.\n' +
                        'event.track: ' +
                        event.track +
                        '\n' +
                        'pcMapper: ' +
                        pcMapper
                )
                let audioTrack =
                    this.unexpectedTracks[peerSocketId] &&
                    this.unexpectedTracks[peerSocketId].audioTrack
                if (newTrack.kind === 'audio') {
                    audioTrack = newTrack
                }
                let videoTrack =
                    this.unexpectedTracks[peerSocketId] &&
                    this.unexpectedTracks[peerSocketId].videoTrack
                if (newTrack.kind === 'video') {
                    videoTrack = newTrack
                }
                this.unexpectedTracks[peerSocketId] = { audioTrack, videoTrack }
            }

            let peerConnectionTrackMapper = { ...this.state.peerConnectionTrackMapper }
            peerConnectionTrackMapper[peerSocketId] = pcMapper
            this.setState({ peerConnectionTrackMapper })
        }
        peerConnection.onremovetrack = (event) => {
            // onremovetrack method coming soon??
        }

        if (!this.state.peerConnectionTrackMapper[peerSocketId]) {
            const pcTrackMap = { ...initializeMapper }
            const peerConnectionTrackMapper = { ...this.state.peerConnectionTrackMapper }
            peerConnectionTrackMapper[peerSocketId] = pcTrackMap
            this.setState({ peerConnectionTrackMapper })
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
            // For some reason, have to re-add audio track after removing video
            let audioTrack
            if (this.state.audio_track_id) {
                const mediaDevices = window && window.navigator && window.navigator.mediaDevices
                if (!mediaDevices) {
                    return this.setState({
                        video_track_id: null,
                        audio_track_id: null,
                        errorMessage: 'Cannot find media devices to stream video.',
                    })
                }
                const stream = await mediaDevices.getUserMedia({
                    video: false,
                    audio: true,
                })
                audioTrack = stream.getAudioTracks()[0]
            }

            Object.values(this.peerConnections).forEach((pc) => {
                pc.getSenders().forEach((sender) => {
                    // some sender instances have already removed tracks (.track is null)
                    if (sender.track && sender.track.id === this.state.video_track_id) {
                        sender.track.stop()
                        pc.removeTrack(sender)
                    }
                })
                if (audioTrack) {
                    pc.addTrack(audioTrack)
                }
            })

            this.ownVideo.current.srcObject.getVideoTracks().forEach((videoTrack) => {
                videoTrack.stop()
                this.ownVideo.current.srcObject.removeTrack(videoTrack)
            })

            return this.setState({ video_track_id: null, errorMessage: '' }, () => {
                this.emitUpdateSharing()
            })
        }

        // toggling ON
        else {
            this.setState({ is_video_loading: true })

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
                Object.values(this.peerConnections).forEach((pc) => {
                    localTracks.forEach((track) => {
                        pc.addTrack(track, localStream)
                    })
                })

                // step 4 - update allClientsInRoom state
                const videoTrack = localStream.getVideoTracks()[0]
                const audioTrack = this.state.audio_track_id && localStream.getAudioTracks()[0]
                this.setState(
                    {
                        is_video_loading: false,
                        video_track_id: videoTrack.id,
                        audio_track_id: audioTrack && audioTrack.id,
                    },
                    () => {
                        this.emitUpdateSharing()
                    }
                )
            } catch (e) {
                console.error(e)
                let errorMessage = e.message
                if (e instanceof DOMException && errorMessage === 'Permission denied') {
                    errorMessage =
                        'Permission denied to use video media. Please allow this site to use your media. If using Google Chrome, click on Menu -> Settings -> Privacy and Security -> Site Settings'
                }

                return this.setState({
                    is_video_loading: false,
                    video_track_id: null,
                    errorMessage,
                })
            }
        }
    }

    handleClickAudio = async () => {
        // remove focus so that user doesn't accidently hit ENTER to re-toggle it
        document.getElementById('audio-button').blur()

        // toggling OFF
        if (this.state.audio_track_id) {
            Object.values(this.peerConnections).forEach((pc) => {
                pc.getSenders().forEach((sender) => {
                    // some sender instances have already removed tracks (.track is null)
                    if (sender.track && sender.track.id === this.state.audio_track_id) {
                        sender.track.stop()
                        if (!this.state.video_track_id) {
                            pc.removeTrack(sender)
                        }
                    }
                })
            })

            return this.setState({ audio_track_id: null, errorMessage: '' }, () => {
                this.emitUpdateSharing()
            })
        }

        // toggling ON
        else {
            this.setState({ is_audio_loading: true })

            // Step 1 - Create RTCPeerConnections (if not there yet)
            this.props.allClientsInRoom.forEach(async (c) => {
                if (!this.peerConnections[c.socket_id] && c.socket_id !== this.props.socket.id) {
                    this.peerConnections[c.socket_id] = await this.createPeerConnection(c.socket_id)
                }
            })

            // Step 2 - Get the auiod stream
            const mediaDevices = window && window.navigator && window.navigator.mediaDevices
            if (!mediaDevices) {
                return this.setState({
                    audio_track_id: null,
                    errorMessage: 'Cannot find media devices to stream audio.',
                })
            }

            try {
                const localStream = await mediaDevices.getUserMedia({
                    video: !!this.state.video_track_id,
                    audio: true,
                })

                // Step 3 - Add all tracks to the feed (video would replace existing video track)
                const allTracks = localStream.getTracks()
                Object.values(this.peerConnections).forEach((pc) => {
                    allTracks.forEach((t) => pc.addTrack(t, localStream))
                })
                this.ownVideo.current.srcObject = localStream
                await this.ownVideo.current.play()

                // Step 4 - Update state and emit the update
                const audioTrack = localStream.getAudioTracks()[0]
                const videoTrack = this.state.video_track_id && localStream.getVideoTracks()[0]
                this.setState(
                    {
                        is_audio_loading: false,
                        audio_track_id: audioTrack.id,
                        video_track_id: videoTrack && videoTrack.id,
                    },
                    () => {
                        this.emitUpdateSharing()
                    }
                )
            } catch (e) {
                let errorMessage = e.message
                if (e instanceof DOMException && errorMessage === 'Permission denied') {
                    errorMessage =
                        'Permission denied to use audio media. Please allow this site to use your media. If using Google Chrome, click on Menu -> Settings -> Privacy and Security -> Site Settings'
                }

                return this.setState({
                    is_audio_loading: false,
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
        if (this.state.screen_video_track_id || this.state.screen_audio_track_id) {
            Object.values(this.peerConnections).forEach((connection) => {
                function removeScreenTrack(trackId) {
                    const sender = connection
                        .getSenders()
                        .find((sender) => sender.track && sender.track.id === trackId)
                    if (sender) {
                        sender.track.stop()
                        connection.removeTrack(sender)
                    }
                }

                if (this.state.screen_video_track_id) {
                    removeScreenTrack(this.state.screen_video_track_id)
                }
                if (this.state.screen_audio_track_id) {
                    removeScreenTrack(this.state.screen_audio_track_id)
                }
            })
            return this.setState(
                { screen_video_track_id: null, screen_audio_track_id: null, errorMessage: '' },
                () => {
                    this.emitUpdateSharing()
                }
            )
        }

        // toggling ON
        else {
            this.setState({ is_screen_share_loading: true })

            // Step 1 - Create RTCPeerConnections (if not there yet)
            this.props.allClientsInRoom.forEach(async (c) => {
                if (!this.peerConnections[c.socket_id] && c.socket_id !== this.props.socket.id) {
                    this.peerConnections[c.socket_id] = await this.createPeerConnection(c.socket_id)
                }
            })

            // Step 2 - Get screen share screen
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
                // display is set to none, but makes for easy retrieval without having to restart the displayMedia
                this.ownScreenVideo.current.srcObject = stream

                // Step 3 = Add video and audio to each peerConnection
                let videoTrack = stream.getVideoTracks()[0]
                let audioTrack = stream.getAudioTracks()[0]

                stream.getTracks().forEach((t) => {
                    t.onended = () => {
                        // do the same thing as clicking the button to stop it. why rewrite code??
                        document.getElementById('share-button').click()
                    }
                })
                Object.values(this.peerConnections).forEach((connection) => {
                    if (videoTrack) {
                        connection.addTrack(videoTrack)
                    }
                    if (audioTrack) {
                        connection.addTrack(audioTrack)
                    }
                })

                // Step 4 - Update state
                this.setState(
                    {
                        is_screen_share_loading: false,
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
                    is_screen_share_loading: false,
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
        const {
            is_audio_loading,
            is_video_loading,
            is_screen_share_loading,
            audio_track_id,
            video_track_id,
            screen_video_track_id,
            errorMessage,
            peerConnectionTrackMapper,
        } = this.state
        const {
            allClientsInRoom,
            socket: { id },
        } = this.props

        const isDisabled = is_audio_loading || is_video_loading || is_screen_share_loading
        let ownDisplayName =
            allClientsInRoom &&
            allClientsInRoom.some((c) => c.socket_id === id) &&
            allClientsInRoom.find((c) => c.socket_id === id).display_name

        // get client data from allClientsInRoom, but
        // get Tracks from peerConnectionTrackMapper
        let otherClientsInRoom = allClientsInRoom
            .filter((c) => c.socket_id !== id)
            .map((client) => {
                let trackData = peerConnectionTrackMapper[client.socket_id]
                return {
                    socketId: client.socket_id,
                    id: client.id,
                    audioTrack: trackData ? trackData.audioTrack : null,
                    videoTrack: trackData ? trackData.videoTrack : null,
                    screenVideoTrack: trackData ? trackData.screenTrack : null,
                    displayName: client.display_name,
                }
            })

        return (
            <div>
                <div className={style.topBar}>
                    <div className={style.participantsList}>
                        <ParticipantsListButton allClientsInRoom={allClientsInRoom} />
                    </div>
                    <h2>
                        <span className={style.label}>Room Name:</span> {this.props.roomId}
                    </h2>
                    <CopyButton copyString={window.location.href} />
                </div>
                <BroadcastVideo otherClientsInRoom={otherClientsInRoom} />
                <OwnVideo
                    ref={this.ownVideo}
                    audio_track_id={audio_track_id}
                    video_track_id={video_track_id}
                    display_name={ownDisplayName}
                />
                <video ref={this.ownScreenVideo} style={{ display: 'none' }} />
                <div className={`${style.errorMessage} ${errorMessage && style.show}`}>
                    <p>{errorMessage}</p>
                    <button
                        type="button"
                        onClick={() => this.setState({ errorMessage: '' })}
                        className={style.close}
                    >
                        X
                    </button>
                </div>
                <div className={style.buttonContainer}>
                    <AudioButton
                        handleClick={this.handleClickAudio}
                        isStreaming={!!audio_track_id}
                        isLoading={is_audio_loading}
                        isDisabled={isDisabled}
                    />
                    <VideoButton
                        handleClick={this.handleClickVideo}
                        isStreaming={!!video_track_id}
                        isLoading={is_video_loading}
                        isDisabled={isDisabled}
                    />
                    {!/iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(
                        navigator.userAgent.toLowerCase()
                    ) && (
                        <ShareButton
                            handleClick={this.handleClickShareScreen}
                            isStreaming={!!screen_video_track_id}
                            isLoading={is_screen_share_loading}
                            isDisabled={isDisabled}
                        />
                    )}
                </div>
            </div>
        )
    }
}
