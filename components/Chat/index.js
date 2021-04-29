import React, { useEffect, useState, useRef } from 'react'
import style from '../../styles/Components/Chat/Chat.module.css'
import Image from 'next/image'
import { formatCode, formatInput } from './helpers.js'
import { ClapButton, CodeButton } from '../Buttons'
import EmojiPicker from '../EmojiPicker'

const Chat = (props) => {
    const { socket, chatMessages, clientDatabaseId, roomId } = props
    const [chatInputValue, setChatInputValue] = useState('')
    const [codeInputValue, setCodeInputValue] = useState('')
    const [isCode, setIsCode] = useState(false)
    const [insertEmojiPos, setInsertEmojiPos] = useState([0, 0])
    const inputEl = useRef(null)
    const chatDiv = useRef(null)

    const emojiButtonId = 'chat-emoji-button'
    const emojiRegex = /&#x[0-9A-Fa-f]+;/g

    // prevent Shift+Enter from actually typing new line character
    useEffect(() => {
        if (codeInputValue === '\n') {
            setCodeInputValue('')
        }
    }, [codeInputValue])

    useEffect(() => {
        // if chat message was sent, reset innerHTML
        if (chatInputValue === '') {
            setChatInnerHtml()
        }
        // if emoji was selected, update immediately
        const selectedEmojis = chatInputValue.match(emojiRegex) || []
        const innerText = inputEl.current.innerText
        const shownEmojis = innerText.match(emojiRegex) || []
        if (selectedEmojis.length !== shownEmojis.length) {
            setChatInnerHtml()
        }
    }, [chatInputValue])

    useEffect(() => {
        function saveInputPosition(e) {
            // if we are blurring away, stash the cursor position for later when we insert an emoji
            if (document.activeElement.id === 'chat-input' && e.target.id !== 'chat-input') {
                let node = e.target
                let isSelectingEmoji = false
                while (node && node.tagName !== 'BODY') {
                    if (node.id === emojiButtonId) {
                        isSelectingEmoji = true
                        break
                    } else {
                        node = node.parentElement
                    }
                }
                if (isSelectingEmoji) {
                    let cursorStart = document.getSelection().anchorOffset
                    let cursorEnd = document.getSelection().focusOffset
                    if (cursorStart > cursorEnd) {
                        const temp = cursorStart
                        cursorStart = cursorEnd
                        cursorEnd = temp
                    }
                    setInsertEmojiPos([cursorStart, cursorEnd])
                } else {
                    const currLength = inputEl.current.innerHTML.replace(emojiRegex, '_').length
                    setInsertEmojiPos([currLength, currLength])
                }
            }
            return
            // see if the person clicked the emoji button
        }
        document.body.addEventListener('mousedown', saveInputPosition)
        return () => document.body.removeEventListener('mousedown', saveInputPosition)
    }, [])

    useEffect(() => {
        // scroll to bottom of chat div to see newest message
        chatDiv.current.scrollTop = chatDiv.current.scrollHeight
    }, [chatMessages])

    function handleChatSubmit(e) {
        if (e) e.preventDefault()

        let message
        if (isCode) {
            message = formatCode(codeInputValue)
        } else {
            message = formatInput(chatInputValue)
        }

        if (!message) {
            return
        }

        socket.emit(
            'chat',
            {
                type: isCode ? 'code' : 'input',
                message,
                fromDbId: clientDatabaseId,
            },
            roomId
        )
        setChatInputValue('')
        setCodeInputValue('')
    }

    function checkForSubmit(e) {
        if (e.code === 'Enter' && (!isCode || e.shiftKey)) {
            e.preventDefault()
            handleChatSubmit()
        }
    }

    function handleTypeCode(e) {
        setCodeInputValue(e.currentTarget.value)
    }

    function handleTypeChat(e) {
        setChatInputValue(e.currentTarget.textContent)
    }

    function setChatInnerHtml() {
        inputEl.current.innerHTML = chatInputValue
    }

    function handleClap() {
        socket.emit(
            'chat',
            {
                type: 'clap',
                message: '',
                fromDbId: clientDatabaseId,
            },
            roomId
        )
    }

    function handleClickCode() {
        setIsCode((prevIsCode) => !prevIsCode)
    }

    function handleSelectEmoji(e, emoji) {
        setChatInputValue((prevState) => {
            return (
                prevState.slice(0, insertEmojiPos[0]) +
                emoji.htmlCode +
                prevState.slice(insertEmojiPos[1])
            )
        })
        inputEl.current.focus()
        const currLength = inputEl.current.innerHTML.replace(emojiRegex, '_').length
        setInsertEmojiPos([currLength, currLength])
    }

    function renderMessage(msg) {
        const date = new Date(msg.createdAt)
        const displayDate =
            (date.getHours() % 12) +
            ':' +
            (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        if (msg.type === 'clap') {
            return (
                <div key={msg.id} className={style.messageContainer}>
                    <p className={`${style.messageMeta} ${style.sound}`}>
                        {displayDate} {msg.senderName} clapped
                    </p>
                </div>
            )
        }

        return (
            <div key={msg.id} className={style.messageContainer}>
                <p className={style.messageMeta}>
                    {displayDate} {msg.senderName}
                </p>
                <div
                    className={`${style.message} ${
                        msg.type === 'code' ? style.code + ' ' + style.noScrollBar : ''
                    }`}
                >
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
                        <p
                            dangerouslySetInnerHTML={{ __html: msg.message }}
                            className={style.normalMessage}
                        />
                    )}
                </div>
            </div>
        )
    }

    const newLines = codeInputValue.match(/\r\n|\n|\r/gm) || []
    return (
        <div className={style.container}>
            <div ref={chatDiv}>{chatMessages.map(renderMessage)}</div>
            <form onSubmit={handleChatSubmit}>
                <div className={style.codeInput} style={{ display: isCode ? 'block' : 'none' }}>
                    <textarea
                        value={codeInputValue}
                        onChange={handleTypeCode}
                        onKeyDown={checkForSubmit}
                        rows={newLines.length + 1}
                    />
                </div>
                <div
                    contentEditable
                    className={`${style.input} ${style.noScrollBar}`}
                    id="chat-input"
                    style={{ display: isCode ? 'none' : 'flex' }}
                    onInput={handleTypeChat}
                    onKeyDown={checkForSubmit}
                    ref={inputEl}
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
                    <EmojiPicker
                        handleSelectEmoji={handleSelectEmoji}
                        isDisabled={isCode}
                        id={emojiButtonId}
                    />
                    <CodeButton handleClick={handleClickCode} isCode={isCode} />
                    <ClapButton handleClick={handleClap} />
                </div>
            </form>
        </div>
    )
}

export default Chat
