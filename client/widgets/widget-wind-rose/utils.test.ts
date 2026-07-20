import { ApiModel } from '@/api'

import { computeWindRose, WIND_ROSE_DIRECTIONS, WIND_SPEED_BINS } from './utils'

const makeItem = (windSpeed?: number, windDeg?: number): ApiModel.Weather => ({
    date: '2024-01-01T00:00:00Z',
    windSpeed,
    windDeg
})

describe('computeWindRose', () => {
    it('returns all-zero bins and no prevailing direction when data is undefined', () => {
        const result = computeWindRose(undefined)

        expect(result.calmPercent).toBe(0)
        expect(result.prevailingDirection).toBeUndefined()
        expect(result.averageSpeed).toBeUndefined()
        expect(result.directionBins).toHaveLength(WIND_ROSE_DIRECTIONS.length)
        result.directionBins.forEach((bins) => expect(bins).toStrictEqual(WIND_SPEED_BINS.map(() => 0)))
    })

    it('ignores readings missing either speed or direction', () => {
        const data = [makeItem(undefined, 90), makeItem(5, undefined), makeItem(5, 90)]
        const result = computeWindRose(data)

        expect(result.averageSpeed).toBe(5)
        expect(result.prevailingDirection).toBe('E')
    })

    it('classifies readings below the calm threshold as calm, excluded from direction bins', () => {
        const data = [makeItem(0.2, 90), makeItem(5, 90)]
        const result = computeWindRose(data)

        expect(result.calmPercent).toBe(50)
        expect(result.prevailingDirection).toBe('E')
        const eastIndex = WIND_ROSE_DIRECTIONS.indexOf('E')
        expect(result.directionBins[eastIndex].reduce((sum, v) => sum + v, 0)).toBe(50)
    })

    it('buckets a reading into the correct direction and speed bin', () => {
        const data = [makeItem(3, 315)]
        const result = computeWindRose(data)

        const nwIndex = WIND_ROSE_DIRECTIONS.indexOf('NW')
        const binIndex = WIND_SPEED_BINS.findIndex((bin) => bin.max === 4)
        expect(result.directionBins[nwIndex][binIndex]).toBe(100)
        expect(result.prevailingDirection).toBe('NW')
        expect(result.prevailingDegrees).toBe(315)
    })

    it('rounds direction to the nearest 45-degree bucket', () => {
        const data = [makeItem(5, 22)]
        expect(computeWindRose(data).prevailingDirection).toBe('N')

        const data2 = [makeItem(5, 23)]
        expect(computeWindRose(data2).prevailingDirection).toBe('NE')
    })

    it('puts a reading exactly at a bin boundary into the lower bin', () => {
        const data = [makeItem(2, 0)]
        const result = computeWindRose(data)
        const binIndex = WIND_SPEED_BINS.findIndex((bin) => bin.max === 2)

        expect(result.directionBins[WIND_ROSE_DIRECTIONS.indexOf('N')][binIndex]).toBe(100)
    })

    it('picks the direction with the most readings as prevailing', () => {
        const data = [makeItem(5, 0), makeItem(5, 0), makeItem(5, 180)]
        expect(computeWindRose(data).prevailingDirection).toBe('N')
    })

    it('computes the mean speed including calm readings', () => {
        const data = [makeItem(0, 0), makeItem(10, 90)]
        expect(computeWindRose(data).averageSpeed).toBe(5)
    })
})
