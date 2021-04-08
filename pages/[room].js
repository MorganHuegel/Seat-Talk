import React from 'react'
import { useRouter } from 'next/router'
import { io } from 'socket.io-client'
import VideoMain from '../components/VideoMain'

const APP_URL = 'https://seat-talk.herokuapp.com'

class Room extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            errorMessage: '',
            isLoading: true,
            allClientsInRoom: [],
            clientDatabaseId: null,
            chatMessages: [],
        }
        this.socket = null
        this.heartbeatHeroku = null
    }

    componentDidMount() {
        const { roomId, displayName } = this.props
        this.socket = io()
        this.socket.on('connectConfirm', ({ clientDatabaseId }) => {
            this.setState({ clientDatabaseId }, () => {
                this.socket.emit('joinRoom', { roomId, clientDatabaseId, displayName })
            })
        })
        this.socket.on('newJoin', ({ allClientsInRoom, chatMessages, newSocketId }) => {
            this.setState({ allClientsInRoom }, () => {
                if (this.socket.id === newSocketId) {
                    this.setState({ chatMessages }, () => {
                        this.socket.emit('watcherJoin', { roomId, requestingSocketId: newSocketId })
                    })
                }
            })
        })
        this.socket.on('updateSharing', ({ updatedUser }) => {
            const index = this.state.allClientsInRoom.findIndex(
                (client) => client.id === updatedUser.id
            )
            const updatedAllClientsInRoom = [...this.state.allClientsInRoom]
            updatedAllClientsInRoom[index] = updatedUser
            this.setState({ allClientsInRoom: updatedAllClientsInRoom })
        })
        this.socket.on('error', ({ errorMessage }) => {
            if (!errorMessage) {
                errorMessage = 'Unknown socket error.'
            }
            this.setState({ errorMessage })
        })
        this.socket.on('userLeftRoom', ({ socket_id }) => {
            this.setState({
                allClientsInRoom: this.state.allClientsInRoom.filter(
                    (client) => client.socket_id !== socket_id
                ),
            })
        })
        this.socket.on('chat', (msg) => {
            const senderName = this.state.allClientsInRoom.find(
                (c) => c.socket_id === msg.fromSocket
            ).display_name
            this.setState({ chatMessages: [...this.state.chatMessages, { ...msg, senderName }] })
        })

        // Every 5 minutes, ping the server to keep dynos from falling asleep.
        // Free Heroku plan has dynos go to sleep after 30 minutes of inactivity,
        // causing reconnection bug.
        this.heartbeatHeroku = setInterval(() => {
            this.socket.emit('heartbeatHeroku')
            return fetch(APP_URL, { method: 'GET' }).then((res) => {})
        }, 1000 * 60 * 5)

        this.setState({ isLoading: false })
    }

    componentWillUnmount() {
        clearInterval(this.heartbeatHeroku)
        this.socket.close()
    }

    render() {
        const { errorMessage, isLoading, allClientsInRoom, chatMessages } = this.state
        if (errorMessage) {
            return <p>{errorMessage}</p>
        } else if (isLoading) {
            return <div>Loading...</div>
        }

        return (
            this.socket && (
                <VideoMain
                    displayName={this.props.displayName}
                    socket={this.socket}
                    roomId={this.props.roomId}
                    clientDatabaseId={this.state.clientDatabaseId}
                    allClientsInRoom={allClientsInRoom}
                    chatMessages={chatMessages}
                />
            )
        )
    }
}

export default function HOCRoom(props) {
    const router = useRouter()
    const roomId = router.query.room

    if (!roomId) {
        return null
    } else {
        return <Room roomId={roomId} {...props} />
    }
}
