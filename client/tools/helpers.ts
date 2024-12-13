/**
 * Encodes an object into a query string.
 *
 * @param data - The data object to be encoded.
 * @returns The encoded query string.
 */
export const encodeQueryData = (data?: any): string => {
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

/**
 * Rounds a number to a specified number of digits.
 *
 * @param value - The number to be rounded.
 * @param digits - The number of digits to round to. Defaults to 4.
 * @returns The rounded number or undefined if the value is undefined.
 */
export const round = (value?: number, digits: number = 4): number | undefined =>
    value ? Number(value.toFixed(digits)) : undefined

/**
 * Checks if a given string is a valid JSON.
 *
 * @param string - The string to be checked.
 * @returns `true` if the string is a valid JSON, otherwise `false`.
 */
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
