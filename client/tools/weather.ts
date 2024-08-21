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
export const convertWindDirection = (degrees: number): 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315 => {
    const normalizedDegrees = degrees % 360

    const directions: (0 | 45 | 90 | 135 | 180 | 225 | 270 | 315)[] = [0, 45, 90, 135, 180, 225, 270, 315]

    const index = Math.round(normalizedDegrees / 45) % 8

    return directions[index]
}
