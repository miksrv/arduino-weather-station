import { ApiModel } from '@/api'

export type ClimateType = {
    year: string
    weather: ApiModel.Weather[]
}
