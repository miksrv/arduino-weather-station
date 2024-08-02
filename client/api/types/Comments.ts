import { User } from './User'

import { ApiTypes } from '@/api/types'

export type Comments = {
    id: string
    content: string
    author: User
    answerId?: string
    created?: ApiTypes.DateTimeType
}
