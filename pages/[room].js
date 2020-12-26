import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { io } from 'socket.io-client'
import VideoMain from '../components/VideoMain'

class Room extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            errorMessage: '',
            isLoading: true,
            allClientsInRoom: [],
        }
        this.socket = null
    }

    componentDidMount() {
        this.socket = io()
        this.socket.on('connectConfirm', () => {
            this.socket.emit('joinRoom', { roomId: this.props.roomId })
        })
        this.socket.on('newJoin', ({ allClientsInRoom }) => {
            this.setState({ allClientsInRoom })
            // if (!this.state.allClientsInRoom.includes(clientId)) {
            //     this.setState({ allClientsInRoom: [...this.state.allClientsInRoom, clientId] })
            // }
        })
        this.socket.on('userLeftRoom', ({ clientId }) => {
            if (this.state.allClientsInRoom.includes(clientId)) {
                this.setState({
                    allClientsInRoom: this.state.allClientsInRoom.filter((id) => id !== clientId),
                })
            }
        })
        this.socket.on('error', ({ errorMessage }) => {
            if (!errorMessage) {
                errorMessage = 'Unknown socket error.'
            }
            this.setState({ errorMessage })
        })

        this.setState({ isLoading: false })
    }

    render() {
        const { errorMessage, isLoading, allClientsInRoom } = this.state
        if (errorMessage) {
            return <p>{errorMessage}</p>
        } else if (isLoading) {
            return <div>Loading...</div>
        }

        return (
            <>
                <p>{JSON.stringify(allClientsInRoom)}</p>
                <VideoMain />
            </>
        )
    }
}

export default function HOCRoom() {
    const router = useRouter()
    const roomId = router.query.room

    if (!roomId) {
        return null
    } else {
        return <Room roomId={roomId} />
    }
}
