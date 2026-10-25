import { colors, getColor, getSensorColor, getSensorColorType, lightColors, resolveCssVar } from './colors'

describe('colors', () => {
    describe('getSensorColorType', () => {
        it('returns the correct color type for each sensor', () => {
            expect(getSensorColorType('temperature')).toBe('red')
            expect(getSensorColorType('feelsLike')).toBe('orange')
            expect(getSensorColorType('pressure')).toBe('purple')
            expect(getSensorColorType('humidity')).toBe('cyan')
            expect(getSensorColorType('dewPoint')).toBe('lightblue')
            expect(getSensorColorType('visibility')).toBe('air')
            expect(getSensorColorType('uvIndex')).toBe('violet')
            expect(getSensorColorType('solEnergy')).toBe('yellow')
            expect(getSensorColorType('solRadiation')).toBe('lime')
            expect(getSensorColorType('clouds')).toBe('navy')
            expect(getSensorColorType('precipitation')).toBe('blue')
            expect(getSensorColorType('windSpeed')).toBe('green')
            expect(getSensorColorType('windGust')).toBe('teal')
            expect(getSensorColorType('windDeg')).toBe('olive')
            expect(() => getSensorColor(undefined)).toThrow('Not implemented yet: undefined case')
        })
    })

    describe('getSensorColor', () => {
        it('returns the correct color array for each sensor', () => {
            expect(getSensorColor('temperature')).toStrictEqual(colors.red)
            expect(getSensorColor('feelsLike')).toStrictEqual(colors.orange)
            expect(getSensorColor('pressure')).toStrictEqual(colors.purple)
            expect(getSensorColor('humidity')).toStrictEqual(colors.cyan)
            expect(getSensorColor('dewPoint')).toStrictEqual(colors.lightblue)
            expect(getSensorColor('visibility')).toStrictEqual(colors.air)
            expect(getSensorColor('uvIndex')).toStrictEqual(colors.violet)
            expect(getSensorColor('solEnergy')).toStrictEqual(colors.yellow)
            expect(getSensorColor('solRadiation')).toStrictEqual(colors.lime)
            expect(getSensorColor('clouds')).toStrictEqual(colors.navy)
            expect(getSensorColor('precipitation')).toStrictEqual(colors.blue)
            expect(getSensorColor('windSpeed')).toStrictEqual(colors.green)
            expect(getSensorColor('windGust')).toStrictEqual(colors.teal)
            expect(getSensorColor('windDeg')).toStrictEqual(colors.olive)
            expect(() => getSensorColor(undefined)).toThrow('Not implemented yet: undefined case')
        })
    })

    describe('getColor', () => {
        it('uses the deeper light tone on the light theme', () => {
            expect(getColor('cyan', 'light')).toStrictEqual(lightColors.cyan)
            expect(getSensorColor('humidity', 'light')).toStrictEqual(lightColors.cyan)
        })

        it('falls back to the shared hue without a light override or on the dark theme', () => {
            expect(getColor('red', 'light')).toStrictEqual(colors.red)
            expect(getColor('cyan', 'dark')).toStrictEqual(colors.cyan)
            expect(getColor('cyan')).toStrictEqual(colors.cyan)
        })

        // WCAG 1.4.11: chart lines and marks need 3:1 against the card they sit on
        const luminance = (hex: string) => {
            const [r, g, b] = [1, 3, 5].map((i) => {
                const c = parseInt(hex.slice(i, i + 2), 16) / 255
                return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
            })
            return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        const contrast = (a: string, b: string) => {
            const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
            return (hi + 0.05) / (lo + 0.05)
        }

        it.each(Object.keys(colors) as Array<keyof typeof colors>)('%s reads on both cards', (name) => {
            expect(contrast(getColor(name, 'light')[0], '#ffffff')).toBeGreaterThanOrEqual(3)
            expect(contrast(getColor(name, 'dark')[0], '#14181d')).toBeGreaterThanOrEqual(3)
        })
    })

    describe('resolveCssVar', () => {
        it('returns fallback on the server (no window)', () => {
            const originalWindow = global.window
            // @ts-expect-error intentionally removing window to simulate SSR
            delete global.window
            expect(resolveCssVar('--color-green', '#4bb34b')).toBe('#4bb34b')
            global.window = originalWindow
        })

        it('returns fallback when CSS variable is not set', () => {
            // jsdom does not resolve CSS custom properties — getPropertyValue returns ''
            expect(resolveCssVar('--nonexistent-var', '#fallback')).toBe('#fallback')
        })
    })
})
