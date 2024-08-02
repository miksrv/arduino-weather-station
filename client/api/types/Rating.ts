import { User } from './User'

import { ApiTypes } from '@/api/types'

export type Rating = {
    value: number
    session?: string
    created?: ApiTypes.DateTimeType
    author?: User
}
