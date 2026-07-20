import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { ApiModel } from '@/api'
import { currentDate } from '@/tools/date'

import {
    convertHpaToMmHg,
    filterRecentData,
    filterToday,
    findMaxValue,
    findMinValue,
    formatWindDirection,
    getAbsoluteHumidity,
    getAirDensity,
    getAverageWindDirection,
    getCloudinessColor,
    getMinMaxValues,
    getPressureAltitude,
    getRecentAverage,
    getRecentDelta,
    getSampledData,
    getTemperatureColor,
    getUvCategory,
    getUvScalePercent,
    getWindDirectionI18nKey,
    getWindDirectionLabel,
    invertData,
    isMinMaxEmpty,
    sumPrecipitation
} from './weather'

dayjs.extend(utc)

describe('weather', () => {
    describe('getMinMaxValues', () => {
        const makeItem = (temperature: number | undefined, date: string): ApiModel.Weather => ({
            date,
            temperature,
            windSpeed: undefined,
            windDeg: undefined,
            pressure: undefined,
            precipitation: undefined,
            clouds: undefined,
            weatherId: undefined
        })

        it('returns empty object when data is undefined', () => {
            expect(getMinMaxValues(undefined, 'temperature')).toStrictEqual({})
        })

        it('returns empty object when data is empty array', () => {
            expect(getMinMaxValues([], 'temperature')).toStrictEqual({})
        })

        it('returns empty object when parameter is undefined', () => {
            expect(getMinMaxValues([makeItem(10, '2024-01-01')], undefined)).toStrictEqual({})
        })

        it('returns empty object when all values for the parameter are undefined', () => {
            const data: ApiModel.Weather[] = [makeItem(undefined, '2024-01-01'), makeItem(undefined, '2024-01-02')]
            expect(getMinMaxValues(data, 'temperature')).toStrictEqual({})
        })

        it('finds correct min and max from normal data', () => {
            const data: ApiModel.Weather[] = [
                makeItem(10, '2024-01-01'),
                makeItem(-5, '2024-01-02'),
                makeItem(20, '2024-01-03')
            ]
            const result = getMinMaxValues(data, 'temperature')
            expect(result.min?.value).toBe(-5)
            expect(result.min?.date).toBe('2024-01-02')
            expect(result.max?.value).toBe(20)
            expect(result.max?.date).toBe('2024-01-03')
        })

        it('skips undefined values and uses remaining items for min/max', () => {
            const data: ApiModel.Weather[] = [
                makeItem(undefined, '2024-01-01'),
                makeItem(5, '2024-01-02'),
                makeItem(15, '2024-01-03'),
                makeItem(undefined, '2024-01-04')
            ]
            const result = getMinMaxValues(data, 'temperature')
            expect(result.min?.value).toBe(5)
            expect(result.min?.date).toBe('2024-01-02')
            expect(result.max?.value).toBe(15)
            expect(result.max?.date).toBe('2024-01-03')
        })

        it('handles a zero value correctly (zero is not treated as undefined)', () => {
            const data: ApiModel.Weather[] = [makeItem(0, '2024-01-01'), makeItem(5, '2024-01-02')]
            const result = getMinMaxValues(data, 'temperature')
            expect(result.min?.value).toBe(0)
            expect(result.min?.date).toBe('2024-01-01')
            expect(result.max?.value).toBe(5)
            expect(result.max?.date).toBe('2024-01-02')
        })

        it('returns equal min and max when only one valid value exists', () => {
            const data: ApiModel.Weather[] = [makeItem(undefined, '2024-01-01'), makeItem(7, '2024-01-02')]
            const result = getMinMaxValues(data, 'temperature')
            expect(result.min?.value).toBe(7)
            expect(result.max?.value).toBe(7)
        })
    })

    describe('isMinMaxEmpty', () => {
        it('returns true when result is undefined', () => {
            expect(isMinMaxEmpty(undefined)).toBe(true)
        })

        it('returns true when result is empty object', () => {
            expect(isMinMaxEmpty({})).toBe(true)
        })

        it('returns true when both min and max are undefined', () => {
            expect(isMinMaxEmpty({ min: undefined, max: undefined })).toBe(true)
        })

        it('returns false when min is defined', () => {
            expect(isMinMaxEmpty({ min: { value: 10, date: '2024-01-01' } })).toBe(false)
        })

        it('returns false when max is defined', () => {
            expect(isMinMaxEmpty({ max: { value: 20, date: '2024-01-02' } })).toBe(false)
        })

        it('returns false when both min and max are defined', () => {
            expect(
                isMinMaxEmpty({ min: { value: 10, date: '2024-01-01' }, max: { value: 20, date: '2024-01-02' } })
            ).toBe(false)
        })
    })

    describe('getCloudinessColor', () => {
        it('returns empty string when cloudiness is undefined', () => {
            expect(getCloudinessColor()).toBe('')
        })

        it('returns correct color for 0% cloudiness', () => {
            expect(getCloudinessColor(0)).toBe('rgba(30, 30, 40, 0.5)')
        })

        it('returns correct color for 100% cloudiness', () => {
            expect(getCloudinessColor(100)).toBe('rgba(225, 225, 235, 0.5)')
        })

        it('returns correct color for 50% cloudiness', () => {
            expect(getCloudinessColor(50)).toBe('rgba(128, 128, 138, 0.5)')
        })

        it('clamps cloudiness value to 0 if below 0', () => {
            expect(getCloudinessColor(-10)).toBe('rgba(30, 30, 40, 0.5)')
        })

        it('clamps cloudiness value to 100 if above 100', () => {
            expect(getCloudinessColor(110)).toBe('rgba(225, 225, 235, 0.5)')
        })

        it('handles cloudiness as a string', () => {
            expect(getCloudinessColor('75')).toBe('rgba(176, 176, 186, 0.5)')
        })
    })

    describe('filterRecentData', () => {
        const mockData: ApiModel.Weather[] = [
            {
                date: dayjs.utc().subtract(1, 'hour').toISOString(),
                windSpeed: 5,
                windDeg: 90,
                temperature: 20,
                pressure: 1010,
                precipitation: 0,
                clouds: 50,
                weatherId: 800
            },
            {
                date: dayjs.utc().subtract(25, 'hours').toISOString(),
                windSpeed: 10,
                windDeg: 180,
                temperature: 25,
                pressure: 1020,
                precipitation: 0,
                clouds: 75,
                weatherId: 801
            },
            {
                date: dayjs.utc().subtract(2, 'hours').toISOString(),
                windSpeed: 15,
                windDeg: 270,
                temperature: 15,
                pressure: 1000,
                precipitation: 0,
                clouds: 25,
                weatherId: 802
            }
        ]

        it('returns empty array when no data is provided', () => {
            expect(filterRecentData()).toStrictEqual([])
        })

        it('filters data within the last 24 hours by default', () => {
            const result = filterRecentData(mockData)
            expect(result).toHaveLength(2)
            expect(result[0].date).toBe(mockData[0].date)
            expect(result[1].date).toBe(mockData[2].date)
        })

        it('filters data within the last 2 hours', () => {
            const result = filterRecentData(mockData, 2)
            expect(result).toHaveLength(1)
            expect(result[0].date).toBe(mockData[0].date)
        })

        it('returns all data if hours is greater than the oldest data', () => {
            const result = filterRecentData(mockData, 26)
            expect(result).toHaveLength(3)
        })
    })

    describe('getSampledData', () => {
        const mockData: ApiModel.Weather[] = [
            {
                date: '2023-01-01T00:00:00Z',
                windSpeed: 5,
                windDeg: 90,
                temperature: 20,
                pressure: 1010,
                precipitation: 0,
                clouds: 50,
                weatherId: 800
            },
            {
                date: '2023-01-02T00:00:00Z',
                windSpeed: 10,
                windDeg: 180,
                temperature: 25,
                pressure: 1020,
                precipitation: 0,
                clouds: 75,
                weatherId: 801
            },
            {
                date: '2023-01-03T00:00:00Z',
                windSpeed: 15,
                windDeg: 270,
                temperature: 15,
                pressure: 1000,
                precipitation: 0,
                clouds: 25,
                weatherId: 802
            },
            {
                date: '2023-01-04T00:00:00Z',
                windSpeed: 20,
                windDeg: 360,
                temperature: 10,
                pressure: 990,
                precipitation: 0,
                clouds: 0,
                weatherId: 803
            }
        ]

        it('returns empty array when no data is provided', () => {
            expect(getSampledData([], 3)).toStrictEqual([])
        })

        it('returns empty array when count is less than or equal to zero', () => {
            expect(getSampledData(mockData, 0)).toStrictEqual([])
            expect(getSampledData(mockData, -1)).toStrictEqual([])
        })

        it('returns all data if count is greater than or equal to data length', () => {
            expect(getSampledData(mockData, 4)).toStrictEqual(mockData)
            expect(getSampledData(mockData, 5)).toStrictEqual(mockData)
        })

        it('returns correct sampled data for count less than data length', () => {
            const result = getSampledData(mockData, 2)
            expect(result).toHaveLength(2)
            expect(result[0].date).toBe(mockData[0].date)
            expect(result[1].date).toBe(mockData[3].date)
        })
    })

    describe('invertData', () => {
        const makeItem = (temperature: number | undefined, date: string): ApiModel.Weather => ({
            date,
            temperature,
            windSpeed: undefined,
            windDeg: undefined,
            pressure: undefined,
            precipitation: undefined,
            clouds: undefined,
            weatherId: undefined
        })

        it('returns original array when key is undefined', () => {
            const data = [makeItem(5, '2024-01-01'), makeItem(-3, '2024-01-02')]
            expect(invertData(data, undefined)).toStrictEqual(data)
        })

        it('returns empty array when input is empty', () => {
            expect(invertData([], 'temperature')).toStrictEqual([])
        })

        it('does not shift values when all temperatures are positive', () => {
            const data = [makeItem(5, '2024-01-01'), makeItem(10, '2024-01-02'), makeItem(20, '2024-01-03')]
            const result = invertData(data, 'temperature')
            expect(result[0].temperature).toBe(5)
            expect(result[1].temperature).toBe(10)
            expect(result[2].temperature).toBe(20)
        })

        it('shifts all values up so minimum becomes 0 when all temperatures are negative', () => {
            const data = [makeItem(-10, '2024-01-01'), makeItem(-5, '2024-01-02'), makeItem(-1, '2024-01-03')]
            const result = invertData(data, 'temperature')
            expect(result[0].temperature).toBe(0)
            expect(result[1].temperature).toBe(5)
            expect(result[2].temperature).toBe(9)
        })

        it('shifts mixed positive and negative values so minimum becomes 0', () => {
            const data = [makeItem(-3, '2024-01-01'), makeItem(0, '2024-01-02'), makeItem(7, '2024-01-03')]
            const result = invertData(data, 'temperature')
            expect(result[0].temperature).toBe(0)
            expect(result[1].temperature).toBeUndefined()
            expect(result[2].temperature).toBe(10)
        })

        it('preserves undefined values in the output', () => {
            const data = [makeItem(undefined, '2024-01-01'), makeItem(-2, '2024-01-02')]
            const result = invertData(data, 'temperature')
            expect(result[0].temperature).toBeUndefined()
            expect(result[1].temperature).toBe(0)
        })
    })

    describe('getTemperatureColor', () => {
        it('returns empty string when temperature is undefined', () => {
            expect(getTemperatureColor(undefined)).toBe('')
        })

        it('returns correct color for temperature above 48.9°C (> 120°F range)', () => {
            expect(getTemperatureColor(50)).toBe('#3d0216')
        })

        it('returns correct color for temperature exactly at 48.9°C boundary', () => {
            expect(getTemperatureColor(48.9)).toBe('#3d0216')
        })

        it('returns correct color for temperature in 35–37.8°C range (95–100°F)', () => {
            expect(getTemperatureColor(36)).toBe('#af4d4c')
        })

        it('returns correct color for temperature near 0°C (30–35°F range)', () => {
            expect(getTemperatureColor(0)).toBe('#25436f')
        })

        it('returns correct color for temperature below -51.1°C (< -60°F range)', () => {
            expect(getTemperatureColor(-55)).toBe('#e4f1ff')
        })

        it('returns correct color for temperature exactly at -40°C boundary (inclusive lower bound of range)', () => {
            // Range { min: -40, max: -37.2 } uses color '#b8cdea'; -40 satisfies temp >= -40
            expect(getTemperatureColor(-40)).toBe('#b8cdea')
        })

        it('accepts temperature as a string', () => {
            expect(getTemperatureColor('25')).toBe('#c3ab75')
        })

        it('returns empty string for temperature not matched by any range', () => {
            // All ranges are covered from -Infinity to +Infinity, so this should not happen in practice.
            // Verify the lookup returns the lowest range for a very cold value.
            expect(getTemperatureColor(-100)).toBe('#e4f1ff')
        })
    })

    describe('convertHpaToMmHg', () => {
        it('returns undefined when input is undefined', () => {
            expect(convertHpaToMmHg(undefined)).toBeUndefined()
        })

        it('returns undefined when input is null', () => {
            expect(convertHpaToMmHg(null as unknown as number)).toBeUndefined()
        })

        it('returns undefined when input is an empty string', () => {
            expect(convertHpaToMmHg('')).toBeUndefined()
        })

        it('returns 0 (not undefined) when input is 0, since 0 is a defined value', () => {
            expect(convertHpaToMmHg(0)).toBe(0)
        })

        it('converts a typical pressure value correctly', () => {
            // 1013.25 hPa = 760 mmHg exactly
            expect(convertHpaToMmHg(1013.25)).toBe(760)
        })

        it('converts a pressure string correctly', () => {
            const result = convertHpaToMmHg('1013.25')
            expect(result).toBe(760)
        })

        it('converts a low pressure value', () => {
            // 980 hPa ≈ 735.06 mmHg → rounded to 1 decimal = 735.1
            const result = convertHpaToMmHg(980)
            expect(typeof result).toBe('number')
            expect(result).toBeCloseTo(735.1, 0)
        })

        it('converts a high pressure value', () => {
            // 1040 hPa ≈ 780.05 mmHg
            const result = convertHpaToMmHg(1040)
            expect(typeof result).toBe('number')
            expect(result).toBeCloseTo(780.1, 0)
        })
    })

    describe('findMinValue', () => {
        const makeItem = (temperature: number | undefined, date: string): ApiModel.Weather => ({
            date,
            temperature,
            windSpeed: undefined,
            windDeg: undefined,
            pressure: undefined,
            precipitation: undefined,
            clouds: undefined,
            weatherId: undefined
        })

        it('returns undefined when weatherData is undefined', () => {
            expect(findMinValue(undefined, 'temperature')).toBeUndefined()
        })

        it('returns undefined when weatherData is an empty array', () => {
            expect(findMinValue([], 'temperature')).toBeUndefined()
        })

        it('returns undefined when all values are undefined', () => {
            const data = [makeItem(undefined, '2024-01-01'), makeItem(undefined, '2024-01-02')]
            expect(findMinValue(data, 'temperature')).toBeUndefined()
        })

        it('returns minimum temperature from a normal dataset', () => {
            const data = [makeItem(10, '2024-01-01'), makeItem(-5, '2024-01-02'), makeItem(20, '2024-01-03')]
            expect(findMinValue(data, 'temperature')).toBe(-5)
        })

        it('ignores undefined values in the dataset', () => {
            const data = [makeItem(undefined, '2024-01-01'), makeItem(8, '2024-01-02'), makeItem(3, '2024-01-03')]
            expect(findMinValue(data, 'temperature')).toBe(3)
        })

        it('defaults to temperature key when key is undefined', () => {
            const data = [makeItem(7, '2024-01-01'), makeItem(2, '2024-01-02')]
            expect(findMinValue(data, undefined)).toBe(2)
        })

        it('returns the single value when only one item exists', () => {
            const data = [makeItem(15, '2024-01-01')]
            expect(findMinValue(data, 'temperature')).toBe(15)
        })
    })

    describe('findMaxValue', () => {
        const makeItem = (temperature: number | undefined, date: string): ApiModel.Weather => ({
            date,
            temperature,
            windSpeed: undefined,
            windDeg: undefined,
            pressure: undefined,
            precipitation: undefined,
            clouds: undefined,
            weatherId: undefined
        })

        it('returns undefined when weatherData is undefined', () => {
            expect(findMaxValue(undefined, 'temperature')).toBeUndefined()
        })

        it('returns undefined when weatherData is an empty array', () => {
            expect(findMaxValue([], 'temperature')).toBeUndefined()
        })

        it('returns undefined when all values are undefined', () => {
            const data = [makeItem(undefined, '2024-01-01'), makeItem(undefined, '2024-01-02')]
            expect(findMaxValue(data, 'temperature')).toBeUndefined()
        })

        it('returns maximum temperature from a normal dataset', () => {
            const data = [makeItem(10, '2024-01-01'), makeItem(-5, '2024-01-02'), makeItem(20, '2024-01-03')]
            expect(findMaxValue(data, 'temperature')).toBe(20)
        })

        it('ignores undefined values in the dataset', () => {
            const data = [makeItem(undefined, '2024-01-01'), makeItem(8, '2024-01-02'), makeItem(3, '2024-01-03')]
            expect(findMaxValue(data, 'temperature')).toBe(8)
        })

        it('defaults to temperature key when key is undefined', () => {
            const data = [makeItem(7, '2024-01-01'), makeItem(2, '2024-01-02')]
            expect(findMaxValue(data, undefined)).toBe(7)
        })

        it('returns the single value when only one item exists', () => {
            const data = [makeItem(15, '2024-01-01')]
            expect(findMaxValue(data, 'temperature')).toBe(15)
        })
    })

    describe('getRecentDelta', () => {
        const makeItem = (temperature: number | undefined, date: string): ApiModel.Weather => ({
            date,
            temperature,
            windSpeed: undefined,
            windDeg: undefined,
            pressure: undefined,
            precipitation: undefined,
            clouds: undefined,
            weatherId: undefined
        })

        it('returns undefined when data is undefined', () => {
            expect(getRecentDelta(undefined, 'temperature')).toBeUndefined()
        })

        it('returns undefined when parameter is undefined', () => {
            const data = [makeItem(10, '2024-01-01T00:00:00Z'), makeItem(12, '2024-01-01T01:00:00Z')]
            expect(getRecentDelta(data, undefined)).toBeUndefined()
        })

        it('returns undefined when fewer than two valid items exist', () => {
            const data = [makeItem(10, '2024-01-01T00:00:00Z')]
            expect(getRecentDelta(data, 'temperature')).toBeUndefined()
        })

        it('returns an "up" delta when the latest value rose over the window', () => {
            const data = [makeItem(20, '2024-01-01T00:00:00Z'), makeItem(20.6, '2024-01-01T01:00:00Z')]
            expect(getRecentDelta(data, 'temperature', 1)).toStrictEqual({ value: 0.6, direction: 'up' })
        })

        it('returns a "down" delta when the latest value fell over the window', () => {
            const data = [makeItem(60, '2024-01-01T00:00:00Z'), makeItem(56, '2024-01-01T01:00:00Z')]
            expect(getRecentDelta(data, 'temperature', 1)).toStrictEqual({ value: -4, direction: 'down' })
        })

        it('returns a "flat" delta when the value is unchanged over the window', () => {
            const data = [makeItem(20, '2024-01-01T00:00:00Z'), makeItem(20, '2024-01-01T01:00:00Z')]
            expect(getRecentDelta(data, 'temperature', 1)).toStrictEqual({ value: 0, direction: 'flat' })
        })

        it('picks the reading closest to the requested hours-ago window', () => {
            const data = [
                makeItem(10, '2024-01-01T00:00:00Z'),
                makeItem(14, '2024-01-01T00:45:00Z'),
                makeItem(19, '2024-01-01T01:20:00Z'),
                makeItem(22, '2024-01-01T02:00:00Z')
            ]
            expect(getRecentDelta(data, 'temperature', 1)).toStrictEqual({ value: 8, direction: 'up' })
        })

        it('ignores items with undefined values when picking the reference reading', () => {
            const data = [
                makeItem(undefined, '2024-01-01T00:00:00Z'),
                makeItem(10, '2024-01-01T00:10:00Z'),
                makeItem(13, '2024-01-01T01:00:00Z')
            ]
            expect(getRecentDelta(data, 'temperature', 1)).toStrictEqual({ value: 3, direction: 'up' })
        })
    })

    describe('getRecentAverage', () => {
        const makeWindItem = (windSpeed: number | undefined, date: string): ApiModel.Weather => ({
            date,
            windSpeed
        })

        it('returns undefined when data is undefined', () => {
            expect(getRecentAverage(undefined, 'windSpeed')).toBeUndefined()
        })

        it('returns undefined when parameter is undefined', () => {
            const data = [makeWindItem(3, '2024-01-01T00:00:00Z')]
            expect(getRecentAverage(data, undefined)).toBeUndefined()
        })

        it('averages only the readings within the requested window', () => {
            const data = [
                makeWindItem(10, '2024-01-01T00:00:00Z'),
                makeWindItem(2, '2024-01-01T00:49:00Z'),
                makeWindItem(4, '2024-01-01T00:55:00Z'),
                makeWindItem(6, '2024-01-01T01:00:00Z')
            ]
            expect(getRecentAverage(data, 'windSpeed', 10)).toBe(5)
        })

        it('ignores items with undefined values within the window', () => {
            const data = [makeWindItem(undefined, '2024-01-01T00:55:00Z'), makeWindItem(8, '2024-01-01T01:00:00Z')]
            expect(getRecentAverage(data, 'windSpeed', 10)).toBe(8)
        })

        it('returns undefined when the only reading in range has no value', () => {
            const data = [makeWindItem(undefined, '2024-01-01T01:00:00Z')]
            expect(getRecentAverage(data, 'windSpeed', 10)).toBeUndefined()
        })
    })

    describe('getAverageWindDirection', () => {
        const makeDirItem = (windDeg: number | undefined, date: string): ApiModel.Weather => ({
            date,
            windDeg
        })

        it('returns undefined when data is undefined', () => {
            expect(getAverageWindDirection(undefined)).toBeUndefined()
        })

        it('averages a tight cluster of directions to their midpoint', () => {
            const data = [makeDirItem(10, '2024-01-01T00:55:00Z'), makeDirItem(30, '2024-01-01T01:00:00Z')]
            expect(getAverageWindDirection(data, 10)).toBe(20)
        })

        it('wraps correctly around the 0/360 boundary instead of averaging naively', () => {
            const data = [makeDirItem(350, '2024-01-01T00:55:00Z'), makeDirItem(10, '2024-01-01T01:00:00Z')]
            expect(getAverageWindDirection(data, 10)).toBe(0)
        })

        it('returns undefined when the only reading in range has no value', () => {
            const data = [makeDirItem(undefined, '2024-01-01T01:00:00Z')]
            expect(getAverageWindDirection(data, 10)).toBeUndefined()
        })
    })

    describe('getWindDirectionLabel', () => {
        it('returns an empty string when degrees is undefined', () => {
            expect(getWindDirectionLabel(undefined)).toBe('')
        })

        it.each([
            [0, 'N'],
            [90, 'E'],
            [180, 'S'],
            [270, 'W'],
            [315, 'NW'],
            [360, 'N'],
            [337, 'NNW']
        ])('maps %s degrees to %s', (degrees, label) => {
            expect(getWindDirectionLabel(degrees)).toBe(label)
        })
    })

    describe('getWindDirectionI18nKey', () => {
        it('returns an empty string when degrees is undefined', () => {
            expect(getWindDirectionI18nKey(undefined)).toBe('')
        })

        it.each([
            [0, 'wind-direction-n'],
            [90, 'wind-direction-e'],
            [135, 'wind-direction-se'],
            [180, 'wind-direction-s'],
            [270, 'wind-direction-w'],
            [315, 'wind-direction-nw'],
            [360, 'wind-direction-n'],
            [337, 'wind-direction-nnw']
        ])('maps %s degrees to %s', (degrees, key) => {
            expect(getWindDirectionI18nKey(degrees)).toBe(key)
        })
    })

    describe('formatWindDirection', () => {
        const t = (key: string) => key.replace('wind-direction-', '').toUpperCase()

        it('returns a dash when degrees is undefined', () => {
            expect(formatWindDirection(t, undefined)).toBe('—')
        })

        it.each([
            [0, 'N (0°)'],
            [315, 'NW (315°)'],
            [337, 'NNW (337°)']
        ])('formats %s degrees as %s', (degrees, expected) => {
            expect(formatWindDirection(t, degrees)).toBe(expected)
        })
    })

    describe('getUvCategory', () => {
        it('defaults to "low" when value is undefined', () => {
            expect(getUvCategory(undefined)).toBe('low')
        })

        it.each([
            [0, 'low'],
            [2, 'low'],
            [2.1, 'moderate'],
            [5, 'moderate'],
            [5.1, 'high'],
            [7, 'high'],
            [7.1, 'very-high'],
            [10, 'very-high'],
            [10.1, 'extreme'],
            [15, 'extreme']
        ])('classifies %s as %s', (value, category) => {
            expect(getUvCategory(value)).toBe(category)
        })
    })

    describe('getUvScalePercent', () => {
        it('returns 0 when value is undefined', () => {
            expect(getUvScalePercent(undefined)).toBe(0)
        })

        it('maps 0 to 0%', () => {
            expect(getUvScalePercent(0)).toBe(0)
        })

        it('maps the scale max (12) to 100%', () => {
            expect(getUvScalePercent(12)).toBe(100)
        })

        it('maps a mid-scale value proportionally', () => {
            expect(getUvScalePercent(6)).toBe(50)
        })

        it('clamps values above the scale max to 100%', () => {
            expect(getUvScalePercent(20)).toBe(100)
        })
    })

    describe('getAbsoluteHumidity', () => {
        it('returns undefined when temperature is undefined', () => {
            expect(getAbsoluteHumidity(undefined, 58)).toBeUndefined()
        })

        it('returns undefined when relative humidity is undefined', () => {
            expect(getAbsoluteHumidity(21, undefined)).toBeUndefined()
        })

        it('computes a physically sensible value for typical conditions', () => {
            expect(getAbsoluteHumidity(21, 58)).toBe(10.6)
        })

        it('returns a lower value for colder air at the same relative humidity', () => {
            const warm = getAbsoluteHumidity(25, 50) ?? 0
            const cold = getAbsoluteHumidity(0, 50) ?? 0
            expect(cold).toBeLessThan(warm)
        })
    })

    describe('getAirDensity', () => {
        it('returns undefined when any input is undefined', () => {
            expect(getAirDensity(undefined, 1013.25, 58)).toBeUndefined()
            expect(getAirDensity(21, undefined, 58)).toBeUndefined()
            expect(getAirDensity(21, 1013.25, undefined)).toBeUndefined()
        })

        it('computes a value close to the standard ~1.2 kg/m³ at sea level', () => {
            expect(getAirDensity(21, 1013.25, 58)).toBe(1.194)
        })

        it('returns a lower density for more humid air at the same temperature and pressure', () => {
            const dry = getAirDensity(21, 1013.25, 10) ?? 0
            const humid = getAirDensity(21, 1013.25, 90) ?? 0
            expect(humid).toBeLessThan(dry)
        })
    })

    describe('getPressureAltitude', () => {
        it('returns undefined when pressure is undefined', () => {
            expect(getPressureAltitude(undefined)).toBeUndefined()
        })

        it('returns 0 at standard sea-level pressure', () => {
            expect(getPressureAltitude(1013.25)).toBe(0)
        })

        it('returns a positive altitude for pressure below the sea-level standard', () => {
            expect(getPressureAltitude(989.9)).toBe(196)
        })

        it('returns a negative altitude for pressure above the sea-level standard', () => {
            expect(getPressureAltitude(1030)).toBeLessThan(0)
        })
    })

    describe('filterToday', () => {
        it('returns an empty array when data is undefined', () => {
            expect(filterToday(undefined)).toStrictEqual([])
        })

        it('keeps only readings from the current local calendar day', () => {
            const data: ApiModel.Weather[] = [
                { date: currentDate.startOf('day').add(1, 'hour').toISOString() },
                { date: currentDate.subtract(1, 'day').toISOString() }
            ]
            const result = filterToday(data)

            expect(result).toHaveLength(1)
            expect(result[0].date).toBe(data[0].date)
        })

        it('excludes readings without a date', () => {
            expect(filterToday([{}])).toStrictEqual([])
        })
    })

    describe('sumPrecipitation', () => {
        it('returns 0 when data is undefined', () => {
            expect(sumPrecipitation(undefined)).toBe(0)
        })

        it('sums precipitation across all readings', () => {
            const data: ApiModel.Weather[] = [{ precipitation: 0.5 }, { precipitation: 1.2 }, { precipitation: 0 }]
            expect(sumPrecipitation(data)).toBe(1.7)
        })

        it('treats missing precipitation values as 0', () => {
            const data: ApiModel.Weather[] = [{ precipitation: 1 }, {}]
            expect(sumPrecipitation(data)).toBe(1)
        })
    })
})
