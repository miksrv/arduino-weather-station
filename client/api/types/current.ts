import { DateTime } from './index'

import { ApiModel } from '@/api'

export interface Response {
    conditions: ApiModel.Weather
    update: DateTime
}
