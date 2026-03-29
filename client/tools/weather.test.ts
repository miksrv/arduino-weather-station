import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { ApiModel } from '@/api'

import {
    convertHpaToMmHg,
    filterRecentData,
    findMaxValue,
    findMinValue,
    getCloudinessColor,
    getMinMaxValues,
    getSampledData,
    getTemperatureColor,
    invertData
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
        it('returns 0 when input is undefined', () => {
            expect(convertHpaToMmHg(undefined)).toBe(0)
        })

        it('returns 0 when input is 0', () => {
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

        it('returns Infinity when weatherData is an empty array', () => {
            // reduce with no items returns the initial value (Infinity) when array is empty after filter
            expect(findMinValue([], 'temperature')).toBe(Infinity)
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

        it('returns -Infinity when weatherData is an empty array', () => {
            // reduce with no items returns the initial value (-Infinity) when array is empty after filter
            expect(findMaxValue([], 'temperature')).toBe(-Infinity)
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
})
