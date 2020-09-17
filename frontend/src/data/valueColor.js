import React from 'react'

const valueColor = value => {
    let color = ''

    if (value >= -20 && value < -15) {
        color = 'value-15-20'
    } else if (value >= -15 && value < -10) {
        color = 'value-10-15'
    } else if (value >= -10 && value < -5) {
        color = 'value-5-10'
    } else if (value >= -5 && value < 0) {
        color = 'value-0-5'
    } else if (value >= 0 && value < 5) {
        color = 'value0-5'
    } else if (value >= 5 && value < 10) {
        color = 'value5-10'
    } else if (value >= 10 && value < 15) {
        color = 'value10-15'
    } else if (value >= 15 && value < 20) {
        color = 'value15-20'
    } else if (value >= 20 && value < 25) {
        color = 'value20-25'
    } else if (value >= 25 && value < 30) {
        color = 'value25-30'
    } else if (value >= 30 && value < 35) {
        color = 'value30-35'
    }

    return <span className={color}>{value}</span>
}

export default valueColor