import { ApiModel } from '@/api'

export type Response = ApiModel.Weather & {
    lastUpdated?: string
    isStale: boolean
}
