import { ApiModel } from '@/api'

export type SensorType = keyof Pick<
    ApiModel.Sensors,
    'temperature' | 'pressure' | 'humidity' | 'precipitation' | 'clouds'
>

export interface Request {
    start_date: string
    end_date: string
    type: SensorType
}

export type Response = ApiModel.Weather[]
