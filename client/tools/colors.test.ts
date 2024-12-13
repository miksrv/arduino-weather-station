import { colors, getSensorColor,getSensorColorType } from './colors'

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
            expect(getSensorColorType(undefined)).toBe('grey')
        })
    })

    describe('getSensorColor', () => {
        it('returns the correct color array for each sensor', () => {
            expect(getSensorColor('temperature')).toEqual(colors.red)
            expect(getSensorColor('feelsLike')).toEqual(colors.orange)
            expect(getSensorColor('pressure')).toEqual(colors.purple)
            expect(getSensorColor('humidity')).toEqual(colors.cyan)
            expect(getSensorColor('dewPoint')).toEqual(colors.lightblue)
            expect(getSensorColor('visibility')).toEqual(colors.air)
            expect(getSensorColor('uvIndex')).toEqual(colors.violet)
            expect(getSensorColor('solEnergy')).toEqual(colors.yellow)
            expect(getSensorColor('solRadiation')).toEqual(colors.lime)
            expect(getSensorColor('clouds')).toEqual(colors.navy)
            expect(getSensorColor('precipitation')).toEqual(colors.blue)
            expect(getSensorColor('windSpeed')).toEqual(colors.green)
            expect(getSensorColor('windGust')).toEqual(colors.teal)
            expect(getSensorColor('windDeg')).toEqual(colors.olive)
            expect(getSensorColor(undefined)).toEqual(colors.grey)
        })
    })
})
