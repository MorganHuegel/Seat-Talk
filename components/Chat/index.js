import React, { useEffect, useRef, useState } from 'react'
import style from '../../styles/Components/Chat/Chat.module.css'
import Image from 'next/image'
import prettier from 'prettier/standalone'
import babelParser from 'prettier/parser-babel'
import graphqlParser from 'prettier/parser-graphql'
import htmlParser from 'prettier/parser-html'
import cssParser from 'prettier/parser-postcss'
import { ClapButton, CodeButton } from '../Buttons'

const Chat = (props) => {
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
        try {
            const formatted = prettier.format(codeInputValue, {
                parser: 'babel',
                plugins: [babelParser, graphqlParser, htmlParser, cssParser],
            })
            console.log('codeInput (formatted babel): ', formatted)
        } catch (e) {
            // if javascript formatter didn't work, maybe it's graphql??
            try {
                const formatted = prettier.format(codeInputValue, {
                    parser: 'graphql',
                    plugins: [babelParser, graphqlParser, htmlParser, cssParser],
                })
                console.log('codeInput (formatted gql): ', formatted)
            } catch (e) {
                // meh, we tried :(
            }
        }
        console.log('codeInput: ', codeInputValue)
        console.log('chatInput: ', chatInputValue)
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

    const newLines = codeInputValue.match(/\r\n|\n|\r/gm) || []
    return (
        <div className={style.container}>
            <div>Chat stuff</div>
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
