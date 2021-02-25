import React from 'react'
import style from '../../styles/Components/Tooltip/Tooltip.module.css'

const Tooltip = ({ message, className }) => {
    return <span className={`${style.tooltip} ${className}`}>{message}</span>
}

export default Tooltip
