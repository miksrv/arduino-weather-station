import { getDiurnalProfile, getHeatmapStats, getHistogram, percentile, toHeatmapPoints } from './heatmap'

describe('heatmap', () => {
    describe('toHeatmapPoints', () => {
        it('places readings at the local hour and day (UTC+5) and drops empty ones', () => {
            const points = toHeatmapPoints(
                [
                    { date: '2026-10-23 20:00:00', temperature: 1 },
                    { date: '2026-10-24 07:00:00', temperature: 5 },
                    { date: '2026-10-24 08:00:00' }
                ],
                'temperature'
            )

            expect(points).toStrictEqual([
                { day: '2026-10-24', hour: 1, date: '2026-10-23 20:00:00', value: 1 },
                { day: '2026-10-24', hour: 12, date: '2026-10-24 07:00:00', value: 5 }
            ])
        })

        it('shows pressure in mm Hg', () => {
            expect(toHeatmapPoints([{ date: '2026-10-24 07:00:00', pressure: 1013 }], 'pressure')[0].value).toBeCloseTo(
                759.8,
                1
            )
        })
    })

    describe('getHeatmapStats', () => {
        const points = [
            { day: '2026-10-23', hour: 3, date: 'a', value: -2 },
            { day: '2026-10-23', hour: 14, date: 'b', value: 6 },
            { day: '2026-10-24', hour: 4, date: 'c', value: 0 },
            { day: '2026-10-24', hour: 15, date: 'd', value: 4 }
        ]

        it('finds the mean, the extremes with their time and the mean daily range', () => {
            expect(getHeatmapStats(points)).toMatchObject({
                count: 4,
                mean: 2,
                min: { value: -2, date: 'a' },
                max: { value: 6, date: 'b' },
                meanDailyRange: 6
            })
        })

        it('totals precipitation by day', () => {
            const rain = [
                { day: '2026-10-23', hour: 3, date: 'a', value: 0.4 },
                { day: '2026-10-23', hour: 4, date: 'b', value: 1.2 },
                { day: '2026-10-24', hour: 4, date: 'c', value: 0 },
                { day: '2026-10-25', hour: 4, date: 'd', value: 0.2 }
            ]

            expect(getHeatmapStats(rain)).toMatchObject({
                total: 1.8,
                wetDays: 2,
                wettestDay: { value: 1.6, date: 'a' }
            })
        })

        it('has no wettest day for a dry period and nothing without points', () => {
            expect(getHeatmapStats([{ day: 'x', hour: 0, date: 'a', value: 0 }])?.wettestDay).toBeUndefined()
            expect(getHeatmapStats([])).toBeUndefined()
        })
    })

    describe('percentile', () => {
        it('interpolates between ranks', () => {
            expect(percentile([0, 10], 50)).toBe(5)
            expect(percentile([1, 2, 3, 4, 5], 10)).toBeCloseTo(1.4)
            expect(percentile([], 50)).toBe(0)
        })
    })

    describe('getDiurnalProfile', () => {
        it('averages each hour of the day with its 10–90% band', () => {
            const points = [0, 10, 20].map((value, i) => ({ day: `d${i}`, hour: 14, date: '', value }))
            const profile = getDiurnalProfile(points)

            expect(profile).toHaveLength(24)
            expect(profile[14]).toStrictEqual({ hour: 14, mean: 10, p10: 2, p90: 18 })
            expect(profile[3]).toStrictEqual({ hour: 3 })
        })

        it('gives precipitation the chance of a wet hour instead of a mean', () => {
            const points = [0, 0, 0.3, 1.2].map((value, i) => ({ day: `d${i}`, hour: 5, date: '', value }))

            expect(getDiurnalProfile(points, 'precipitation')[5]).toStrictEqual({ hour: 5, mean: 50 })
        })
    })

    describe('getHistogram', () => {
        it('counts values in whole-unit bins between the min and the max', () => {
            const points = [-1.5, 0.2, 0.7, 3.9].map((value) => ({ day: '', hour: 0, date: '', value }))

            expect(getHistogram(points, 'temperature', 6)).toStrictEqual([
                { from: -2, to: -1, count: 1 },
                { from: -1, to: 0, count: 0 },
                { from: 0, to: 1, count: 2 },
                { from: 1, to: 2, count: 0 },
                { from: 2, to: 3, count: 0 },
                { from: 3, to: 4, count: 1 }
            ])
        })

        it('leaves the dry hours out of precipitation and bins it by thresholds', () => {
            const points = [0, 0, 0, 0.2, 0.5, 1.2, 14].map((value) => ({ day: '', hour: 0, date: '', value }))

            expect(getHistogram(points, 'precipitation')).toStrictEqual([
                { from: 0.1, to: 0.5, count: 1 },
                { from: 0.5, to: 1, count: 1 },
                { from: 1, to: 2.5, count: 1 },
                { from: 2.5, to: 5, count: 0 },
                { from: 5, to: 10, count: 0 },
                { from: 10, to: 14, count: 1 }
            ])
        })

        it('is empty without values', () => {
            expect(getHistogram([], 'temperature')).toStrictEqual([])
        })
    })
})
