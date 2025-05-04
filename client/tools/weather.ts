import dayjs from 'dayjs'

import { ApiModel } from '@/api'
import { round } from '@/tools/helpers'

/**
 * Represents the result of finding the minimum and maximum values.
 */
export interface MinMaxResult {
    /**
     * The minimum value and its corresponding date.
     */
    min?: {
        value: number
        date: string
    }
    /**
     * The maximum value and its corresponding date.
     */
    max?: {
        value: number
        date: string
    }
}

/**
 *
 * @param data Array<ApiModel.Weather>
 * @param parameter keyof ApiModel.Weather
 */
export const getMinMaxValues = (data?: ApiModel.Weather[], parameter?: keyof ApiModel.Weather): MinMaxResult => {
    if (!data?.length || !parameter) {
        return {}
    }

    let minValue = data[0][parameter] as number
    let minDate = data[0].date
    let maxValue = data[0][parameter] as number
    let maxDate = data[0].date

    data.forEach((item) => {
        const value = item[parameter] as number
        const date = item.date

        if (value < minValue) {
            minValue = value
            minDate = date
        }

        if (value > maxValue) {
            maxValue = value
            maxDate = date
        }
    })

    return {
        min: {
            value: minValue,
            date: minDate ?? ''
        },
        max: {
            value: maxValue,
            date: maxDate ?? ''
        }
    }
}

/**
 * Function to find the minimum value
 * @param weatherData
 * @param key
 */
export const findMinValue = (weatherData?: ApiModel.Weather[], key?: keyof ApiModel.Sensors): number | undefined =>
    weatherData
        ?.map((data) => data[key ?? 'temperature']) // Get values by key
        ?.filter((value) => value !== undefined) // Filter only existing values
        ?.reduce((min, value) => (value !== undefined && value < min ? value : min), Infinity)

/**
 * Inverts the values of the specified sensor data key within the weather data array to ensure all values are positive.
 * If there are negative values, it calculates the minimum value and adds its absolute value to each data point for that key.
 *
 * @param {ApiModel.Weather[]} weatherData - The array of weather data points, each containing various sensor readings.
 * @param {keyof ApiModel.Sensors} key - The key representing the specific sensor data to invert.
 * @returns {ApiModel.Weather[]} - The transformed array with all specified sensor values adjusted to be non-negative, preserving original structure.
 */
export const invertData = (weatherData: ApiModel.Weather[] = [], key?: keyof ApiModel.Sensors): ApiModel.Weather[] => {
    if (!key) {
        return weatherData
    }

    const values = weatherData.map((data) => data[key]).filter((value): value is number => value !== undefined)

    const minValue = Math.min(...values)
    const offset = minValue < 0 ? Math.abs(minValue) : 0

    return weatherData.map((data) => ({
        ...data,
        [key]: data[key] ? data[key] + offset : undefined
    }))
}

/**
 * Function to find the maximum value
 * @param weatherData
 * @param key
 */
export const findMaxValue = (weatherData?: ApiModel.Weather[], key?: keyof ApiModel.Sensors): number | undefined =>
    weatherData
        ?.map((data) => data[key ?? 'temperature']) // Get values by key
        ?.filter((value) => value !== undefined) // Filter only existing values
        ?.reduce((max, value) => (value !== undefined && value > max ? value : max), -Infinity)

/**
 * Converts pressure from hectopascals (hPa) to millimeters of mercury (mmHg).
 * @param hPa Pressure in hectopascals (hPa).
 * @returns Pressure in millimeters of mercury (mmHg).
 */
export const convertHpaToMmHg = (hPa?: number | string): number => {
    if (!hPa) {
        return 0
    }

    const mmHg = Number(hPa) * (760 / 1013.25)
    return round(parseFloat(mmHg.toFixed(2)), 1) ?? mmHg
}

/**
 * Converts a temperature value to a color.
 * Temperature in degrees Celsius, where cold temperatures are displayed in blue and hot temperatures are displayed in red.
 * @param temperature Temperature in degrees Celsius.
 * @returns A string with the color in HEX format.
 */
export const getTemperatureColor = (temperature?: number | string): string => {
    if (typeof temperature === 'undefined') {
        return ''
    }

    const temp = Number(temperature)

    // Colors and their corresponding temperature ranges (in degrees Celsius)
    const temperatureColors: Array<{ min: number; max: number; color: string }> = [
        { min: 48.9, max: Infinity, color: '#3d0216' }, // > 120°F
        { min: 46.1, max: 48.9, color: '#580b25' }, // 115-120°F
        { min: 43.3, max: 46.1, color: '#6e1532' }, // 110-115°F
        { min: 40.6, max: 43.3, color: '#87203e' }, // 105-110°F
        { min: 37.8, max: 40.6, color: '#9f294d' }, // 100-105°F
        { min: 35, max: 37.8, color: '#af4d4c' }, // 95-100°F
        { min: 32.2, max: 35, color: '#be6f4c' }, // 90-95°F
        { min: 29.4, max: 32.2, color: '#c38b53' }, // 85-90°F
        { min: 26.7, max: 29.4, color: '#c19d62' }, // 80-85°F
        { min: 23.9, max: 26.7, color: '#c3ab75' }, // 75-80°F
        { min: 21.1, max: 23.9, color: '#aca87d' }, // 70-75°F
        { min: 18.3, max: 21.1, color: '#879b84' }, // 65-70°F
        { min: 15.6, max: 18.3, color: '#658c89' }, // 60-65°F
        { min: 12.8, max: 15.6, color: '#438090' }, // 55-60°F
        { min: 10, max: 12.8, color: '#277593' }, // 50-55°F
        { min: 7.2, max: 10, color: '#276789' }, // 45-50°F
        { min: 4.4, max: 7.2, color: '#275b80' }, // 40-45°F
        { min: 1.7, max: 4.4, color: '#264f77' }, // 35-40°F
        { min: -1.1, max: 1.7, color: '#25436f' }, // 30-35°F
        { min: -3.9, max: -1.1, color: '#2f4774' }, // 25-30°F
        { min: -6.7, max: -3.9, color: '#39517e' }, // 20-25°F
        { min: -9.4, max: -6.7, color: '#415c87' }, // 15-20°F
        { min: -12.2, max: -9.4, color: '#4d6690' }, // 10-15°F
        { min: -15, max: -12.2, color: '#57719d' }, // 5-10°F
        { min: -17.8, max: -15, color: '#617ba7' }, // 0-5°F
        { min: -20.6, max: -17.8, color: '#7691b9' }, // -5-0°F
        { min: -23.3, max: -20.6, color: '#809bc4' }, // -10--5°F
        { min: -26.1, max: -23.3, color: '#8aa5ce' }, // -15--10°F
        { min: -28.9, max: -26.1, color: '#93b1d6' }, // -20--15°F
        { min: -31.7, max: -28.9, color: '#9db8de' }, // -25--20°F
        { min: -34.4, max: -31.7, color: '#a8bfe3' }, // -30--25°F
        { min: -37.2, max: -34.4, color: '#b0c6e6' }, // -35--30°F
        { min: -40, max: -37.2, color: '#b8cdea' }, // -40--35°F
        { min: -42.8, max: -40, color: '#c0d4ed' }, // -45--40°F
        { min: -45.6, max: -42.8, color: '#cbdaf3' }, // -50--45°F
        { min: -48.3, max: -45.6, color: '#d3e2f7' }, // -55--50°F
        { min: -51.1, max: -48.3, color: '#dbe9fb' }, // -60--55°F
        { min: -Infinity, max: -51.1, color: '#e4f1ff' } // < -60°F
    ]

    const matchedColor = temperatureColors.find(({ min, max }) => temp >= min && temp < max)

    return matchedColor ? matchedColor.color : ''
}

/**
 * Converts cloudiness value to color.
 * Cloudiness percentage, where 0% is dark sky and 100% is light sky.
 * TODO: With a white color scheme, the text color on the dark background is too contrasting
 * @param cloudiness Cloudiness percentage from 0 to 100.
 * @returns String with color in HEX format.
 */
export const getCloudinessColor = (cloudiness?: number | string): string => {
    if (typeof cloudiness === 'undefined') {
        return ''
    }

    const clouds = Number(cloudiness)

    // Clamp cloudiness value between 0 and 100%
    const clampedCloudiness = Math.max(0, Math.min(100, clouds))

    // Calculate cloudiness percentage between 0 and 1
    const cloudinessPercent = clampedCloudiness / 100

    // Linear interpolation of colors (from dark to light)
    const r = Math.round(30 + (225 - 30) * cloudinessPercent) // Red channel
    const g = Math.round(30 + (225 - 30) * cloudinessPercent) // Green channel
    const b = Math.round(40 + (235 - 40) * cloudinessPercent) // Blue channel

    return `rgba(${r}, ${g}, ${b}, 0.5)`
}

/**
 * Get maximus of *hours* data
 * @param data
 * @param hours
 */
export const filterRecentData = (data?: ApiModel.Weather[], hours: number = 24): ApiModel.Weather[] | [] => {
    const now = dayjs.utc()
    const hoursAgo = now.subtract(hours, 'hours')

    return data?.filter((item) => dayjs.utc(item.date).isAfter(hoursAgo)) || []
}

/**
 * Returns a sampled subset of the input data array.
 *
 * @param {ApiModel.Weather[]} data - The input array of weather data.
 * @param {number} count - The number of samples to return.
 * @returns {ApiModel.Weather[]} The sampled subset of the input data array.
 */
export const getSampledData = (data: ApiModel.Weather[], count: number): ApiModel.Weather[] => {
    if (!data || data.length === 0 || count <= 0) {
        return []
    }

    if (data.length <= count) {
        return data
    }

    const step = (data.length - 1) / (count - 1)
    const sampledData = []

    for (let i = 0; i < count; i++) {
        const index = Math.round(i * step)
        sampledData.push(data[index])
    }

    return sampledData
}
