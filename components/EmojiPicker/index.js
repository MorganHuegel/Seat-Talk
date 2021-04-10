import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSmile } from '@fortawesome/free-regular-svg-icons'
import Tooltip from '../Tooltip'
import style from '../../styles/Components/EmojiPicker/EmojiPicker.module.css'

const options = [
    { unicode: '0x1F600', htmlCode: '&#x1F600;', description: 'grinning' },
    { unicode: '0x1F604', htmlCode: '&#x1F604;', description: 'smile' },
    { unicode: '0x1F344', htmlCode: '&#x1F344;', description: 'mushroom' },
    { unicode: '0x1F37F', htmlCode: '&#x1F37F;', description: 'popcorn' },
    { unicode: '0x1F355', htmlCode: '&#x1F355;', description: 'pizza' },
    { unicode: '0x1F354', htmlCode: '&#x1F354;', description: 'hamburger' },
    { unicode: '0x1F35F', htmlCode: '&#x1F35F;', description: 'french fries' },
    { unicode: '0x1F6C0', htmlCode: '&#x1F6C0;', description: 'bath' },
    { unicode: '0x1F48E', htmlCode: '&#x1F48E;', description: 'diamond' },
    { unicode: '0x23F0', htmlCode: '&#x23F0;', description: 'alarm clock' },
    { unicode: '0x1F431', htmlCode: '&#x1F431;', description: 'cat' },
    { unicode: '0x1F42A', htmlCode: '&#x1F42A;', description: 'camel' },
    { unicode: '0x1F439', htmlCode: '&#x1F439;', description: 'hamster' },
    { unicode: '0x1F424', htmlCode: '&#x1F424;', description: 'duck' },
    { unicode: '0x1F99D', htmlCode: '&#x1F99D;', description: 'raccoon' },
]

const EmojiPicker = ({ handleSelectEmoji }) => {
    const [isExpanded, setIsExpanded] = useState(false)

    function handleClickButton(e) {
        e.currentTarget.blur()
        setIsExpanded((prev) => !prev)
    }

    return (
        <span className={style.relative}>
            <button type="button" onClick={handleClickButton} className={style.button}>
                <FontAwesomeIcon icon={faSmile} />
                <span className={style.tooltip}>
                    <Tooltip message="Emoji" className={style.bottom} />
                </span>
            </button>
            {isExpanded && (
                <div className={style.selectContainer}>
                    {options.map((option) => (
                        <span
                            className={style.emoji}
                            dangerouslySetInnerHTML={{ __html: option.htmlCode }}
                            onClick={(e) => handleSelectEmoji(e, option)}
                        />
                    ))}
                </div>
            )}
        </span>
    )
}

export default EmojiPicker
