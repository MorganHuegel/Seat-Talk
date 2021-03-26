import React, { useRef, useState } from 'react'
import style from '../../styles/Components/Chat/Chat.module.css'
import { ClapButton, CodeButton } from '../Buttons'

const Chat = (props) => {
    const chatInput = useRef(null)
    const [isCode, setIsCode] = useState(false)

    function handleChatSubmit(e) {
        e.preventDefault()
        console.log('chatIinput: ', chatInput.current.value)
        chatInput.current.value = ''
    }

    function handleClap() {
        console.log('clap')
    }

    function handleClickCode() {
        setIsCode((prevIsCode) => !prevIsCode)
    }

    return (
        <div className={style.container}>
            <div>Chat stuff</div>
            <form onSubmit={handleChatSubmit}>
                <input ref={chatInput} type="text" className={style.input} />
                <div className={style.btnContainer}>
                    <button>Emoji</button>
                    <CodeButton handleClick={handleClickCode} isCode={isCode} />
                    <ClapButton handleClick={handleClap} />
                </div>
            </form>
        </div>
    )
}

export default Chat
