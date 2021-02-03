import React, { useState } from 'react'
import style from '../../styles/Components/SecureWrapper/SecureWrapper.module.css'
import { useRouter } from 'next/router'
import Link from 'next/link'

const SecureWrapper = (props) => {
    const currentPath = useRouter().pathname
    const [acceptJoin, setAcceptJoin] = useState(false)

    return (
        <>
            {currentPath === '/[room]' && !acceptJoin && (
                <div className={style.modalContainer}>
                    <div className={style.formContainer}>
                        <h2 className={style.formHeader}>Welcome!</h2>
                        <div className={style.buttonContainer}>
                            <Link href="/">
                                <a className={style.homeLink}>Home</a>
                            </Link>
                            <button
                                type="button"
                                className={style.joinButton}
                                onClick={() => setAcceptJoin(true)}
                            >
                                Join Room
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {(currentPath !== '/[room]' || acceptJoin) && props.children}
        </>
    )
}

export default SecureWrapper
