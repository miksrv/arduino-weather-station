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

export const round = (value?: number, digits: number = 4): number | undefined =>
    value ? Number(value.toFixed(digits)) : undefined

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
