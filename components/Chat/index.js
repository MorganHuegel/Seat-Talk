import React, { useEffect, useState } from 'react'
import style from '../../styles/Components/Chat/Chat.module.css'
import Image from 'next/image'
import formatCode from './formatCode.js'
import { ClapButton, CodeButton } from '../Buttons'

const Chat = (props) => {
    const { socket, chatMessages, clientDatabaseId } = props
    const [chatInputValue, setChatInputValue] = useState('')
    const [codeInputValue, setCodeInputValue] = useState('')
    const [isCode, setIsCode] = useState(false)

    // prevent Shift+Enter from actually typing new line character
    useEffect(() => {
        if (codeInputValue === '\n') {
            setCodeInputValue('')
        }
    }, [codeInputValue])

    function handleChatSubmit(e) {
        if (e) e.preventDefault()
        const formattedCodeInput = formatCode(codeInputValue)
        socket.emit('chat', {
            type: isCode ? 'code' : 'input',
            message: isCode ? formattedCodeInput : chatInputValue,
            fromDbId: clientDatabaseId,
        })
        setChatInputValue('')
        setCodeInputValue('')
    }

    function checkForSubmit(e) {
        if (e.code === 'Enter' && (!isCode || e.shiftKey)) {
            handleChatSubmit()
        }
    }

    function handleTypeCode(e) {
        setCodeInputValue(e.currentTarget.value)
    }

    function handleTypeChat(e) {
        setChatInputValue(e.currentTarget.value)
    }

    function handleClap() {
        console.log('clap')
    }

    function handleClickCode() {
        setIsCode((prevIsCode) => !prevIsCode)
    }

    function renderMessage(msg) {
        const date = new Date(msg.createdAt)
        const displayDate =
            (date.getHours() % 12) +
            ':' +
            (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        return (
            <div key={msg.id} className={style.messageContainer}>
                <p className={style.messageMeta}>
                    {displayDate} {msg.senderName}
                </p>
                <div className={`${style.message} ${msg.type === 'code' ? style.code : ''}`}>
                    {msg.type === 'code' ? (
                        msg.message
                            .split(/\r\n|\r|\n/g)
                            .filter((txt) => txt) // remove empty strings
                            // for code indentation, replace back-to-back spaces with &nbsp;&nbsp;
                            .map((line, i) => (
                                <p key={i}>
                                    {[...line.replace(/\s\s/g, '\t')].map((letter) =>
                                        letter === '\t' ? <span>&nbsp;&nbsp;</span> : letter
                                    )}
                                </p>
                            ))
                    ) : (
                        <p>{msg.message}</p>
                    )}
                </div>
            </div>
        )
    }

    const newLines = codeInputValue.match(/\r\n|\n|\r/gm) || []
    return (
        <div className={style.container}>
            <div>{chatMessages.map(renderMessage)}</div>
            <form onSubmit={handleChatSubmit}>
                <div className={style.codeInput} style={{ display: isCode ? 'block' : 'none' }}>
                    <textarea
                        value={codeInputValue}
                        onChange={handleTypeCode}
                        onKeyDown={checkForSubmit}
                        rows={newLines.length + 1}
                    />
                </div>
                <input
                    onChange={handleTypeChat}
                    value={chatInputValue}
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
