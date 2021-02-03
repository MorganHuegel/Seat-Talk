import React, { useState, useEffect, useRef } from 'react'
import style from '../../styles/Components/SecureWrapper/SecureWrapper.module.css'
import { useRouter } from 'next/router'
import Link from 'next/link'

const SecureWrapper = (props) => {
    const currentPath = useRouter().pathname
    const [acceptJoin, setAcceptJoin] = useState(false)
    const [requiredMessage, setRequiredMessage] = useState(false)
    const [displayName, setDisplayName] = useState('')
    const displayNameInput = useRef()

    useEffect(() => {
        // must put this code in useEffect because window is not defined when server-rendered
        const webToken = window.localStorage.getItem('authToken')
        if (webToken) {
            setDisplayName('fooBar') // decode web token
        }
    }, [])

    function handleClickJoin() {
        let name = displayNameInput.current.value
        if (!name) {
            setRequiredMessage(true)
        }

        // get JSON Web Token and store in local storage
        setAcceptJoin(true)
    }

    return (
        <>
            {currentPath === '/[room]' && !acceptJoin && (
                <div className={style.modalContainer}>
                    <div className={style.formContainer}>
                        {displayName ? (
                            <h2 className={style.formHeader}>Welcome, {displayName}!</h2>
                        ) : (
                            <>
                                <h2 className={style.formHeader}>Welcome!</h2>
                                <label htmlFor="display-name">
                                    Display Name:{' '}
                                    {requiredMessage && (
                                        <span className={style.requiredMessage}>*required</span>
                                    )}
                                </label>
                                <input
                                    className={`${style.formInput} ${
                                        requiredMessage && style.required
                                    }`}
                                    name="display-name"
                                    ref={displayNameInput}
                                    onChange={() => setRequiredMessage(false)}
                                />
                            </>
                        )}
                        <div className={style.buttonContainer}>
                            <button
                                type="button"
                                className={style.joinButton}
                                onClick={handleClickJoin}
                            >
                                Join Room
                            </button>
                            <Link href="/">
                                <a className={style.homeLink}>Return Home</a>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
            {(currentPath !== '/[room]' || acceptJoin) && props.children}
        </>
    )
}

export default SecureWrapper
