import React from 'react'

/**
 * Returns the value of the parameter by key from the address bar of the browser
 * @example `?start=24.06.2021&end=30.06.2021`
 * @param name
 * @returns {string|string}
 */
export const getUrlParameter = name => {
    name = name.replace(/[\\[]/, '\\[').replace(/[\]]/, '\\]')
    let regex = new RegExp('[\\?&]' + name + '=([^&#]*)')
    let results = regex.exec(window.location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '))
}

/**
 * Returns the name of the season based on the current date
 * @returns {string}
 */
export const getSeason = () => {
    const date = new Date(),
        month = date.getMonth() + 1

    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'

    return 'winter'
}

/**
 * Formats seconds into a familiar format (hours, minutes)
 * @param sec
 * @returns {string}
 */
export const timeAgo = sec => {
    if (sec === null || sec <= 0)
        return 'Обновлено недавно'

    let h = sec/3600 ^ 0
    let m = (sec-h*3600)/60 ^ 0
    let s = sec-h*3600-m*60
    return ((h > 0 ? (h < 10 ? '0' + h : h) + ' ч. ' : '')
        + (m > 0 ? (m < 10 ? '0' + m : m) + ' мин. ' : '')
        + (s > 0 ? (s < 10 ? '0' + s : s) + ' сек.' : '')) + ' назад'
}

/**
 * Adds a span and assigns a color class based on the input value (e.g. temperature)
 * @param value
 * @returns {JSX.Element}
 */
export const valueColor = value => {
    let color = ''

    if (value >= -25 && value < -20) {
        color = 'value-20-25'
    } else if (value >= -20 && value < -15) {
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

/**
 * Replaces directions in degrees with a text corresponding value
 * @param value
 * @returns {string}
 */
export const windDirection = value => {
    if (value === 0) {
        return 'Север'
    } else if (value === 45) {
        return 'Северо-восток'
    } else if (value === 90) {
        return 'Восток'
    } else if (value === 135) {
        return 'Юго-восток'
    } else if (value === 180) {
        return 'Юг'
    } else if (value === 225) {
        return 'Юго-запад'
    } else if (value === 270) {
        return 'Запад'
    } else {
        return 'Северо-запад'
    }
}

/**
 * Creates an array of objects for the wind rose graph (wind speed and direction)
 * @param data
 * @returns {{}}
 */
export const createWindRose = data => {
    let result  = {}

    for (let id in data) {
        if (id === 6) continue

        result[id] = data[id]
    }

    return result
}