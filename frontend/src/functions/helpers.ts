import translate from './translate'

// #TODO: Fix type
export const degToCompass = (degree: number | undefined) => {
    if (typeof degree !== 'number') return ''

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