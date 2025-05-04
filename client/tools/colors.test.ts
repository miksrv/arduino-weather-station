import { colors, getSensorColor, getSensorColorType } from './colors'

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
})
