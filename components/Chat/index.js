import React, { useRef, useState } from 'react'
import style from '../../styles/Components/Chat/Chat.module.css'
import Image from 'next/image'
import { ClapButton, CodeButton } from '../Buttons'

const Chat = (props) => {
    const chatForm = useRef(null)
    const chatInput = useRef(null)
    const codeInput = useRef(null)
    const [isCode, setIsCode] = useState(false)

    function handleChatSubmit(e) {
        if (e) e.preventDefault()
        console.log('chatIinput: ', chatInput.current.value)
        console.log('codeInput: ', codeInput.current.value)
        chatInput.current.value = ''
        codeInput.current.value = ''
    }

    function checkForSubmit(e) {
        if (e.code === 'Enter' && e.shiftKey) {
            handleChatSubmit()
        }
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
            <form onSubmit={handleChatSubmit} ref={chatForm}>
                <div className={style.codeInput} style={{ display: isCode ? 'block' : 'none' }}>
                    <textarea ref={codeInput} onKeyDown={checkForSubmit} />
                </div>
                <input
                    ref={chatInput}
                    type="text"
                    className={style.input}
                    style={{ display: isCode ? 'none' : 'inline-block' }}
                />
                <div>
                    <p className={style.submitInstructions}>
                        Submit using{' '}
                        {isCode && (
                            <>
                                Shift ({' '}
                                <span className={style.shiftIcon}>
                                    <Image
                                        src="/shift key.jpeg"
                                        alt="Shift Key"
                                        width={12}
                                        height={12}
                                        layout="fixed"
                                    />
                                </span>{' '}
                                ) +{' '}
                            </>
                        )}
                        Enter ({' '}
                        <span className={style.enterIcon}>
                            <Image
                                src="/enter key.jpeg"
                                alt="Enter Key"
                                width={12}
                                height={12}
                                layout="fixed"
                            />
                        </span>{' '}
                        )
                    </p>
                </div>
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
