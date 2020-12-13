import React from 'react'

export default class VideoMain extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            isStreamingVideo: false,
            isStreamingAudio: false,
            errorMessage: '',
        }
        this.ownVideo = React.createRef()
    }

    handleClickVideo = async () => {
        // if it is currently playing, toggle it OFF
        if (this.state.isStreamingVideo) {
            this.ownVideo.current.srcObject
                .getVideoTracks()
                .forEach((mediaTrack) => mediaTrack.stop())
            if (!this.state.isStreamingAudio) {
                this.ownVideo.current.srcObject = null
            }
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

    getUserMediaConstraints = () => ({
        video: this.state.isStreamingVideo,
        audio: this.state.isStreamingAudio,
    })

    render() {
        const { isStreamingAudio, isStreamingVideo, errorMessage } = this.state

        return (
            <div>
                <video ref={this.ownVideo} />
                {errorMessage && <p>{errorMessage}</p>}
                <button type="button" id="toggle-video" onClick={this.handleClickVideo}>
                    Video - {isStreamingVideo ? 'ON' : 'OFF'}
                </button>
            </div>
        )
    }
}
