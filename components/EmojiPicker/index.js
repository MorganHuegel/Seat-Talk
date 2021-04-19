import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSmile } from '@fortawesome/free-regular-svg-icons'
import Tooltip from '../Tooltip'
import style from '../../styles/Components/EmojiPicker/EmojiPicker.module.css'
import options from './options.json'

const EmojiPicker = ({ handleSelectEmoji, isDisabled, id }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [hoverOption, setHoverOption] = useState('')

    useEffect(() => {
        if (isDisabled) {
            setIsExpanded(false)
        }
    }, [isDisabled])

    useEffect(() => {
        function closeOnClickElsewhere(e) {
            let node = e.target
            while (node.parentNode && node.tagName !== 'HTML') {
                if (node.classList.contains(style.selectContainer)) {
                    return
                }
                node = node.parentNode
            }
            setIsExpanded(false)
        }
        const body = document.getElementsByTagName('body')[0]
        if (isExpanded) {
            body.addEventListener('click', closeOnClickElsewhere)
        } else {
            body.removeEventListener('click', closeOnClickElsewhere)
        }
        return () => body.removeEventListener('click', closeOnClickElsewhere)
    }, [isExpanded])

    function handleClickButton(e) {
        e.currentTarget.blur()
        setIsExpanded((prev) => !prev)
    }

    function handleClickEmoji(e, option) {
        setIsExpanded(false)
        setHoverOption('')
        handleSelectEmoji(e, option)
    }

    return (
        <span className={style.relative}>
            <button
                id={id}
                type="button"
                onClick={handleClickButton}
                className={style.button}
                disabled={isDisabled}
            >
                <FontAwesomeIcon icon={faSmile} />
                <span className={style.tooltip}>
                    <Tooltip message="Emoji" className={style.bottom} />
                </span>
            </button>
            {isExpanded && (
                <div className={style.selectContainer}>
                    <div className={style.options}>
                        {options.map((option) => (
                            <span
                                key={option.unicode}
                                className={style.emoji}
                                dangerouslySetInnerHTML={{ __html: option.htmlCode }}
                                onClick={(e) => handleClickEmoji(e, option)}
                                onMouseEnter={() => setHoverOption(option)}
                                onMouseLeave={() => setHoverOption('')}
                            />
                        ))}
                    </div>
                    <div className={style.preview}>
                        {hoverOption ? (
                            <>
                                <span dangerouslySetInnerHTML={{ __html: hoverOption.htmlCode }} />{' '}
                                {hoverOption.description}
                            </>
                        ) : (
                            <span className={style.placeholdPreview} />
                        )}
                    </div>
                </div>
            )}
        </span>
    )
}

export default EmojiPicker
