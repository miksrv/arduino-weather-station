import dayjs, { Dayjs } from 'dayjs'

const TIME_ZONE = 'Asia/Yekaterinburg'

export const encodeQueryData = (data: any): string => {
    if (typeof data === 'undefined' || !data) {
        return ''
    }

    const ret = []

    for (const d in data) {
        if (d && data[d]) {
            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]))
        }
    }

    return ret.length ? '?' + ret.join('&') : ''
}

export const getDate = (date: string | Date): Dayjs => dayjs.utc(date).tz(TIME_ZONE)

export const formatDate = (date?: string | Date, format: string = 'D MMMM YYYY, HH:mm'): string =>
    date ? getDate(date).format(format) : ''

export const timeAgo = (date?: string | Date, withoutSuffix?: boolean): string =>
    date ? getDate(date).fromNow(withoutSuffix) : ''

export const minutesAgo = (date?: string | Date): number => (date ? dayjs().diff(getDate(date), 'minute') : 99999999)

export const round = (value?: number, digits: number = 4): number | undefined =>
    value ? Number(value.toFixed(digits)) : undefined

export const concatClassNames = (...args: Array<string | boolean | null | undefined>): string =>
    args.filter((item) => !!item).join(' ')

export const addDecimalPoint = (input: number | string | undefined): string => {
    if (!input) {
        return ''
    }

    const inputValue: string = typeof input === 'number' ? input.toString() : input

    if (inputValue.includes('.')) {
        const [integerPart, decimalPart] = inputValue.split('.')
        if (decimalPart === '') {
            return `${integerPart}.0`
        }

        return inputValue
    }
    return `${inputValue}.0`
}

export const isValidJSON = (string: string) => {
    if (!string || !string.length) {
        return true
    }

    try {
        JSON.parse(string)
    } catch (e) {
        console.error(e)

        return false
    }

    return true
}
