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
