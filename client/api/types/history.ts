import { DateTime } from './index'

import { ApiModel } from '@/api'

export interface Request {
    start_date: string
    end_date: string
}

export type Response = (ApiModel.Weather & { date: DateTime })[]
