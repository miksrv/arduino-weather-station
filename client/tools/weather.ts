import dayjs from 'dayjs'

import { ApiModel } from '@/api'

export interface MinMaxResult {
    min?: {
        value: number
        date: string
    }
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
 * Converts pressure from hectopascals (hPa) to millimeters of mercury (mmHg).
 * @param hPa Pressure in hectopascals (hPa).
 * @returns Pressure in millimeters of mercury (mmHg).
 */
export const convertHpaToMmHg = (hPa?: number | string): number => {
    if (!hPa) {
        return 0
    }

    const mmHg = Number(hPa) * (760 / 1013.25)
    return parseFloat(mmHg.toFixed(2))
}

/**
 * Converts wind direction (0 to 360 degrees) to an 8-point direction.
 * @param degrees Wind direction in degrees (0 to 360).
 * @returns One of 8 directions (0, 45, 90, 135, 180, 225, 270, 315 degrees).
 */
export const convertWindDirection = (degrees?: number): 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315 | undefined => {
    if (!degrees) {
        return
    }

    const normalizedDegrees = degrees % 360

    const directions: (0 | 45 | 90 | 135 | 180 | 225 | 270 | 315)[] = [0, 45, 90, 135, 180, 225, 270, 315]

    const index = Math.round(normalizedDegrees / 45) % 8

    return directions[index]
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

    // Temperature limits
    const minTemp = -35 // Minimum temperature for blue
    const maxTemp = 35 // Maximum temperature for red

    // Limit temperature between minTemp and maxTemp
    const clampedTemp = Math.max(minTemp, Math.min(maxTemp, temp))

    // Calculate temperature percentage between 0 and 1
    const tempPercent = (clampedTemp - minTemp) / (maxTemp - minTemp)

    // Linear color interpolation (from blue to red)
    const r = Math.round(255 * tempPercent) // Red channel
    const g = Math.round(0) // Green channel (not used)
    const b = Math.round(255 * (1 - tempPercent)) // Blue channel

    return `rgba(${r}, ${g}, ${b}, 0.5)`
}

/**
 * Converts cloudiness value to color.
 * Cloudiness percentage, where 0% is dark sky and 100% is light sky.
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
