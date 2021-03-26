import React, { useRef } from 'react'
import style from '../../styles/Components/Chat/Chat.module.css'

const Chat = (props) => {
    const chatInput = useRef(null)

    function handleChatSubmit(e) {
        e.preventDefault()
        console.log('chatIinput: ', chatInput.current.value)
    }

    return (
        <div className={style.container}>
            <div>Chat stuff</div>
            <form onSubmit={handleChatSubmit}>
                <input ref={chatInput} type="text" />
            </form>
        </div>
    )
}

export default Chat
