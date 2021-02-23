import React, { useRef } from 'react'
import Head from 'next/head'
import style from '../styles/Home.module.css'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { JoinButton } from '../components/Buttons'

export default function Home() {
    const router = useRouter()
    const roomName = useRef()

    function getRandomLetter() {
        let randNum = Math.round(Math.random() * 24)
        let char = String.fromCharCode(97 + randNum)
        if (Math.random() > 0.5) {
            char = char.toUpperCase()
        }
        return char
    }
    function handleClickStart() {
        let room = roomName.current.value
        if (room === '') {
            for (let i = 0; i < 6; i++) {
                room += getRandomLetter()
            }
        }
        router.push(`/${room}`)
    }

    return (
        <div className={style.page}>
            <Head>
                <title>Seat Talk</title>
                <link rel="icon" href="/favicon.ico" />
                <link rel="preconnect" href="https://fonts.gstatic.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Architects+Daughter&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className={style.wordBubble}>
                <div className={style.bubbleOuter} />
                <div className={style.bubbleInner} />
                <div className={style.arrow} />
                <span className={style.text}>Welcome to Seat Talk!</span>
            </div>

            <div className={style.icon}>
                <Image src="/favicon.ico" width="100%" height="100%" />
            </div>

            <div className={style.join}>
                <label>Room Name:</label>
                <input type="text" placeholder="random" ref={roomName} />
                <JoinButton handleClick={handleClickStart} text="Start or join room" />
            </div>
        </div>
    )
}
