import {
    capitalize,
    findToday,
    formatSigned,
    getDaySummary,
    getNightRanges,
    getPrecipitationLevel,
    getRangePosition,
    getTemperatureBounds,
    getTemperatureHue,
    getWindLevel,
    isNightHour,
    sumHourlyPrecipitation
} from './forecast'

describe('forecast', () => {
    describe('getPrecipitationLevel', () => {
        it('follows the usual thresholds', () => {
            expect(getPrecipitationLevel(undefined)).toBe('none')
            expect(getPrecipitationLevel(0.05)).toBe('none')
            expect(getPrecipitationLevel(0.1)).toBe('light')
            expect(getPrecipitationLevel(2.5)).toBe('moderate')
            expect(getPrecipitationLevel(10)).toBe('heavy')
        })
    })

    describe('getWindLevel', () => {
        it('maps speeds to words', () => {
            expect(getWindLevel(undefined)).toBe('calm')
            expect(getWindLevel(1.9)).toBe('calm')
            expect(getWindLevel(4)).toBe('light')
            expect(getWindLevel(6)).toBe('moderate')
            expect(getWindLevel(10)).toBe('strong')
            expect(getWindLevel(15)).toBe('storm')
        })
    })

    describe('getTemperatureBounds', () => {
        it('spans the lowest minimum and the highest maximum of all days', () => {
            expect(
                getTemperatureBounds([
                    { temperatureMin: -3, temperatureMax: 4 },
                    { temperatureMin: 1, temperatureMax: 9 }
                ])
            ).toStrictEqual({ min: -3, max: 9 })
        })

        it('falls back to the mean temperature and to undefined without data', () => {
            expect(getTemperatureBounds([{ temperature: 5 }])).toStrictEqual({ min: 5, max: 5 })
            expect(getTemperatureBounds([])).toBeUndefined()
            expect(getTemperatureBounds(undefined)).toBeUndefined()
        })
    })

    describe('getRangePosition', () => {
        const bounds = { min: -10, max: 10 }

        it('places the range on the common scale', () => {
            expect(getRangePosition(-5, 5, bounds)).toStrictEqual({ left: 25, width: 50 })
        })

        it('keeps a visible minimum width inside the bar', () => {
            expect(getRangePosition(10, 10, bounds)).toStrictEqual({ left: 96, width: 4 })
        })

        it('survives a zero span', () => {
            expect(getRangePosition(3, 3, { min: 3, max: 3 })).toStrictEqual({ left: 0, width: 4 })
        })
    })

    describe('night hours', () => {
        // Station time is UTC+5: 13:00 UTC is 18:00 local, 01:00 UTC is 06:00 local
        it('splits the day at 6:00 and 18:00 station time', () => {
            expect(isNightHour('2026-10-24 12:00:00')).toBe(false)
            expect(isNightHour('2026-10-24 13:00:00')).toBe(true)
            expect(isNightHour('2026-10-24 01:00:00')).toBe(false)
            expect(isNightHour(undefined)).toBe(false)
        })

        it('merges consecutive night hours into ranges', () => {
            const hours = ['11', '12', '13', '14', '15'].map((h) => ({ date: `2026-10-24 ${h}:00:00` }))

            expect(getNightRanges(hours)).toStrictEqual([[2, 4]])
            expect(getNightRanges(undefined)).toStrictEqual([])
        })
    })

    describe('findToday', () => {
        it('finds the local day of the given moment', () => {
            const days = [{ date: '2026-10-24 00:00:00' }, { date: '2026-10-25 00:00:00' }]

            // 20:00 UTC on the 24th is already the 25th at the station
            expect(findToday(days, '2026-10-24T20:00:00Z')).toBe(days[1])
            expect(findToday(days, '2026-10-24T08:00:00Z')).toBe(days[0])
            expect(findToday(undefined)).toBeUndefined()
        })
    })

    describe('sumHourlyPrecipitation', () => {
        it('adds the hours up to one decimal', () => {
            expect(sumHourlyPrecipitation([{ precipitation: 0.12 }, { precipitation: 0.31 }, {}])).toBe(0.4)
            expect(sumHourlyPrecipitation(undefined)).toBe(0)
        })
    })

    describe('formatSigned', () => {
        it('rounds and signs', () => {
            expect(formatSigned(4.6)).toBe('+5°')
            expect(formatSigned(-2.4)).toBe('−2°')
            expect(formatSigned(0.3)).toBe('0°')
            expect(formatSigned(undefined)).toBe('—')
        })
    })

    describe('getDaySummary', () => {
        it('describes a dry, calm day', () => {
            expect(
                getDaySummary({ temperatureMin: -3, temperatureMax: 5, precipitation: 0, windSpeed: 1 })
            ).toStrictEqual([
                { key: 'forecast-summary-temperature', values: { max: '+5°', min: '−3°' } },
                { key: 'forecast-summary-dry' },
                { key: 'forecast-summary-wind-calm' }
            ])
        })

        it('mentions precipitation and strong gusts', () => {
            const summary = getDaySummary({ precipitation: 4.2, windSpeed: 6, windGust: 13.6 })

            expect(summary).toStrictEqual([
                { key: 'forecast-summary-precip-moderate', values: { value: 4.2 } },
                { key: 'forecast-summary-wind-moderate-gusts', values: { gust: 14 } }
            ])
        })
    })

    describe('getTemperatureHue', () => {
        it('returns the stop colours and clamps the ends', () => {
            expect(getTemperatureHue(0)).toBe('#2fa6d0')
            expect(getTemperatureHue(-40)).toBe('#5b7fe0')
            expect(getTemperatureHue(45)).toBe('#e5484d')
        })

        it('blends between two stops', () => {
            expect(getTemperatureHue(5)).toBe('#84a673')
        })
    })

    describe('capitalize', () => {
        it('upper-cases the first letter only', () => {
            expect(capitalize('вс')).toBe('Вс')
            expect(capitalize('')).toBe('')
        })
    })
})
