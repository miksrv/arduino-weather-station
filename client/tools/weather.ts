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

export const getMinMaxValues = (data?: ApiModel.History[], parameter?: keyof ApiModel.History): MinMaxResult => {
    if (!data?.length || !parameter) {
        return {}
    }

    let minValue = data[0][parameter] as number
    let minDate = data[0].date.date
    let maxValue = data[0][parameter] as number
    let maxDate = data[0].date.date

    data.forEach((item) => {
        const value = item[parameter] as number
        const date = item.date.date

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
            date: minDate
        },
        max: {
            value: maxValue,
            date: maxDate
        }
    }
}
