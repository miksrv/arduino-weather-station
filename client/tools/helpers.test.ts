import { encodeQueryData, isValidJSON, round } from './helpers'

describe('helpers', () => {
    describe('encodeQueryData', () => {
        it('returns empty string when data is undefined', () => {
            expect(encodeQueryData(undefined)).toBe('')
        })

        it('returns empty string when data is null', () => {
            expect(encodeQueryData(null)).toBe('')
        })

        it('returns empty string when data is an empty object', () => {
            expect(encodeQueryData({})).toBe('')
        })

        it('encodes a single key-value pair', () => {
            expect(encodeQueryData({ key: 'value' })).toBe('?key=value')
        })

        it('encodes multiple key-value pairs', () => {
            expect(encodeQueryData({ key1: 'value1', key2: 'value2' })).toBe('?key1=value1&key2=value2')
        })

        it('encodes special characters', () => {
            expect(encodeQueryData({ 'key with spaces': 'value with spaces' })).toBe('?key%20with%20spaces=value%20with%20spaces')
        })

        it('ignores keys with undefined or null values', () => {
            expect(encodeQueryData({ key1: 'value1', key2: undefined, key3: null })).toBe('?key1=value1')
        })
    })

    describe('round', () => {
        it('returns undefined when value is undefined', () => {
            expect(round(undefined)).toBeUndefined()
        })

        it('rounds to 4 digits by default', () => {
            expect(round(1.234567)).toBe(1.2346)
        })

        it('rounds to specified number of digits', () => {
            expect(round(1.234567, 2)).toBe(1.23)
            expect(round(1.234567, 3)).toBe(1.235)
        })

        it('returns the same number if no rounding is needed', () => {
            expect(round(1.2345, 4)).toBe(1.2345)
        })

        it('handles rounding of negative numbers', () => {
            expect(round(-1.234567, 2)).toBe(-1.23)
        })
    })

    describe('isValidJSON', () => {
        global.console.error = jest.fn()
        global.console.warn = jest.fn()

        it('returns true for empty string', () => {
            expect(isValidJSON('')).toBe(true)
        })

        it('returns true for valid JSON string', () => {
            expect(isValidJSON('{"key": "value"}')).toBe(true)
        })

        it('returns false for invalid JSON string', () => {
            expect(isValidJSON('{"key": "value"')).toBe(false)
        })

        it('returns true for string with only whitespace', () => {
            expect(isValidJSON('   ')).toBe(false)
        })

        it('returns false for non-JSON string', () => {
            expect(isValidJSON('not a json')).toBe(false)
        })
    })
})
