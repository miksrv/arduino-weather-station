import translate from './translate'

export const declOfNum = (number: number, words: any[]) => {
    return words[(number % 100 > 4 && number % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(number % 10 < 5) ? number % 10 : 5]]
}

export const degToCompass = (degree: number) => {
    const lang = translate().weather.wind_direction
    const val = Math.floor((degree / 22.5) + 0.5)
    const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const res = arr[(val % 16)] as keyof typeof lang

    return lang[res]
}

export const timeAgo = (sec: number) => {
    const lang = translate().timeago

    if (sec === null || sec <= 0)
        return lang.recently

    let h = sec/3600 ^ 0
    let m = (sec-h*3600)/60 ^ 0
    let s = sec-h*3600-m*60

    return ((h > 0 ? (h < 10 ? '0' + h : h) + ` ${lang.h} ` : '')
        + (m > 0 ? (m < 10 ? '0' + m : m) + ` ${lang.m} ` : '')
        + (s > 0 ? (s < 10 ? '0' + s : s) + ` ${lang.s}` : '')) + ` ${lang.ago}`
}

/**
 * Returns the value of the parameter by key from the address bar of the browser
 * @example `?start=24.06.2021&end=30.06.2021`
 * @param name
 * @returns {string|string}
 */
export const getUrlParameter = (name: string) => {
    name = name.replace(/[\\[]/, '\\[').replace(/[\]]/, '\\]')
    let regex = new RegExp('[\\?&]' + name + '=([^&#]*)')
    let results = regex.exec(window.location.search);

    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '))
}