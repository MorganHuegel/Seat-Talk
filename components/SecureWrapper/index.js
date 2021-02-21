import React, { useState, useEffect, useRef } from 'react'
import style from '../../styles/Components/SecureWrapper/SecureWrapper.module.css'
import { useRouter } from 'next/router'
import jwt from 'jsonwebtoken'

const SecureWrapper = (props) => {
    const currentPath = useRouter().pathname
    const [acceptJoin, setAcceptJoin] = useState(false)
    const [requiredMessage, setRequiredMessage] = useState(false)
    const [displayName, setDisplayName] = useState('')
    const displayNameInput = useRef()
    const rememberMeInput = useRef()

    useEffect(() => {
        // must put this code in useEffect because window is not defined when server-rendered
        const authToken = window.localStorage.getItem('authToken')
        if (authToken) {
            try {
                let decoded = jwt.verify(authToken, process.env.NEXT_PUBLIC_JWT_SECRET)
                let { name, exp } = decoded
                if (new Date().getTime() / 1000 > exp) {
                    window.localStorage.removeItem('authToken')
                    return
                } else {
                    setDisplayName(name)
                }
            } catch (err) {
                console.error('decoding error: ', err)
            }
        }
    }, [])

    async function handleClickJoin() {
        if (displayName) {
            return setAcceptJoin(true)
        }

        let name = displayNameInput.current.value
        let rememberMe = rememberMeInput.current.checked

        if (!name) {
            return setRequiredMessage(true)
        }

        if (rememberMe) {
            // get JSON web token
            let response = await fetch('/api/user', {
                method: 'POST',
                body: JSON.stringify({ name }),
            })
            response = await response.json()
            if (response.error) {
                console.error(response.error)
                setDisplayName(name)
                setAcceptJoin(true)
                return
            }

            const { authToken } = response
            window.localStorage.setItem('authToken', authToken)
        }

        setDisplayName(name)
        setAcceptJoin(true)
    }

    function handleEditName() {
        localStorage.removeItem('authToken')
        setDisplayName('')
    }

    function renderChildrenWithProps() {
        return React.Children.map(props.children, (child) => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child, { displayName })
            }
            return child
        })
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
                                <div className={style.formCheckbox}>
                                    <label>
                                        <input type="checkbox" ref={rememberMeInput} />
                                        &nbsp;Remember me
                                    </label>
                                </div>
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
                            {displayName && (
                                <button
                                    type="button"
                                    onClick={handleEditName}
                                    className={style.homeLink}
                                >
                                    Edit name
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {(currentPath !== '/[room]' || acceptJoin) && renderChildrenWithProps()}
        </>
    )
}

export default SecureWrapper
