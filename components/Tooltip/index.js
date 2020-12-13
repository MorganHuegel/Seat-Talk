import React from 'react'
import style from '../../styles/Components/Tooltip/Tooltip.module.css'

const Tooltip = ({ message }) => {
    return <span className={style.tooltip}>{message}</span>
}

export default Tooltip
