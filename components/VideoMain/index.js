import React from 'react'
import style from '../../styles/Components/VideoMain/VideoMain.module.css'
import { AudioButton, VideoButton, ShareButton } from '../Buttons'
import OwnVideo from './OwnVideo'

export default class VideoMain extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            isStreamingVideo: false,
            isStreamingAudio: false,
            isSharingScreen: false,
            errorMessage: '',
        }
        this.ownVideo = React.createRef()
    }

    handleClickVideo = () => {
        document.getElementById('video-button').blur()

        // if it is currently playing, toggle it OFF
        if (this.state.isStreamingVideo) {
            this.ownVideo.current.srcObject
                .getVideoTracks()
                .forEach((mediaTrack) => mediaTrack.stop())
            return this.setState({ isStreamingVideo: false, errorMessage: '' })
        }

        // toggling ON
        else {
            this.setState({ isStreamingVideo: true, errorMessage: '' }, async () => {
                const mediaDevices = window && window.navigator && window.navigator.mediaDevices
                if (!mediaDevices) {
                    return this.setState({
                        isStreamingVideo: false,
                        errorMessage: 'Cannot find media devices to stream video.',
                    })
                }

                try {
                    const stream = await mediaDevices.getUserMedia(this.getUserMediaConstraints())
                    this.ownVideo.current.srcObject = stream
                    this.ownVideo.current.play()
                } catch (e) {
                    let errorMessage = e.message
                    if (e instanceof DOMException && errorMessage === 'Permission denied') {
                        errorMessage =
                            'Permission denied to use video media. Please allow this site to use your media. If using Google Chrome, click on Menu -> Settings -> Privacy and Security -> Site Settings'
                    }

                    return this.setState({
                        isStreamingVideo: false,
                        errorMessage,
                    })
                }
            })
        }
    }

    handleClickAudio = () => {
        // if it is currently playing, toggle it OFF
        if (this.state.isStreamingAudio) {
            this.ownVideo.current.srcObject
                .getAudioTracks()
                .forEach((mediaTrack) => mediaTrack.stop())
            return this.setState({ isStreamingAudio: false, errorMessage: '' })
        }

        // toggling ON
        else {
            this.setState({ isStreamingAudio: true, errorMessage: '' }, async () => {
                const mediaDevices = window && window.navigator && window.navigator.mediaDevices
                if (!mediaDevices) {
                    return this.setState({
                        isStreamingAudio: false,
                        errorMessage: 'Cannot find media devices to stream audio.',
                    })
                }

                try {
                    const stream = await mediaDevices.getUserMedia(this.getUserMediaConstraints())
                    this.ownVideo.current.srcObject = stream
                    this.ownVideo.current.play()
                } catch (e) {
                    let errorMessage = e.message
                    if (e instanceof DOMException && errorMessage === 'Permission denied') {
                        errorMessage =
                            'Permission denied to use audio media. Please allow this site to use your media. If using Google Chrome, click on Menu -> Settings -> Privacy and Security -> Site Settings'
                    }

                    return this.setState({
                        isStreamingAudio: false,
                        errorMessage,
                    })
                }
            })
        }
    }

    handleClickShareScreen = () => {}

    getUserMediaConstraints = () => ({
        video: this.state.isStreamingVideo,
        audio: this.state.isStreamingAudio,
    })

    render() {
        const { isStreamingAudio, isStreamingVideo, isSharingScreen, errorMessage } = this.state

        return (
            <div>
                <OwnVideo ref={this.ownVideo} />
                {errorMessage && <p>{errorMessage}</p>}
                <div className={style.buttonContainer}>
                    <AudioButton
                        handleClick={this.handleClickAudio}
                        isStreaming={isStreamingAudio}
                    />
                    <VideoButton
                        handleClick={this.handleClickVideo}
                        isStreaming={isStreamingVideo}
                    />
                    <ShareButton
                        handleClick={this.handleClickShareScreen}
                        isStreaming={isSharingScreen}
                    />
                </div>
            </div>
        )
    }
}
