// #TODO: Fix type
export const degToCompass = (degree: number | undefined) => {
    if (typeof degree !== 'number') return ''

    const val = Math.floor((degree / 22.5) + 0.5)
    const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

    return arr[(val % 16)]
}

export const timeAgo = (sec: number) => {
    if (sec === null || sec <= 0)
        return 'Обновлено недавно'

    let h = sec/3600 ^ 0
    let m = (sec-h*3600)/60 ^ 0
    let s = sec-h*3600-m*60

    return ((h > 0 ? (h < 10 ? '0' + h : h) + ' ч. ' : '')
        + (m > 0 ? (m < 10 ? '0' + m : m) + ' мин. ' : '')
        + (s > 0 ? (s < 10 ? '0' + s : s) + ' сек.' : '')) + ' назад'
}