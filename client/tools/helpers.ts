import dayjs from 'dayjs'

export const truncateText = (text?: string, maxLength: number = 300) => {
    if (!text || text.length <= maxLength) {
        return text
    }

    const lastSpaceIndex = text.lastIndexOf(' ', maxLength)

    if (lastSpaceIndex === -1) {
        return text.slice(0, maxLength)
    }

    return text.slice(0, lastSpaceIndex)
}

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

export const makeActiveLink = (link: string) => {
    if (link === '') {
        return ''
    }

    if (link.includes('http://') || link.includes('https://')) {
        return link
    }
    return `https://${link}`
}

export const equalsArrays = (array1?: string[], array2?: string[]): boolean =>
    (!array1?.length && !array2?.length) ||
    (!!array1?.length &&
        !!array2?.length &&
        array1.length === array2.length &&
        array1.every((item) => array2.includes(item)))

export const removeProtocolFromUrl = (url: string): string => url.replace(/^https?:\/\//, '')

export const numberFormatter = (num: number, digits?: number) => {
    const lookup = [
        { symbol: '', value: 1 },
        { symbol: 'k', value: 1e3 },
        { symbol: 'M', value: 1e6 },
        { symbol: 'G', value: 1e9 },
        { symbol: 'T', value: 1e12 },
        { symbol: 'P', value: 1e15 },
        { symbol: 'E', value: 1e18 }
    ]

    if (num < 1) {
        return num
    }

    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
    const item = lookup
        .slice()
        .reverse()
        .find((item) => num >= item.value)

    return item ? (num / item.value).toFixed(digits || 1).replace(rx, '$1') + item.symbol : '0'
}

export const formatDate = (date?: string | Date, format: string = 'D MMMM YYYY, HH:mm'): string =>
    date ? dayjs.utc(date).local().format(format) : ''

export const dateToUnixTime = (date?: string | Date): number => dayjs(date).unix()

export const formatDateISO = (date?: string | Date): string => dayjs(date).toISOString()

export const timeAgo = (date?: string | Date, withoutSuffix?: boolean): string =>
    date ? dayjs.utc(date).fromNow(withoutSuffix) : ''

export const minutesAgo = (date?: string | Date): number => (date ? dayjs().diff(dayjs.utc(date), 'minute') : 99999999)

export const formatDateUTC = (date?: string | Date): string =>
    date ? dayjs(date).format('YYYY-MM-DDTHH:mm:ss[Z]') : ''

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
