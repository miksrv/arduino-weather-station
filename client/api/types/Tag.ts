import { ApiTypes } from '@/api/types'

export type Tag = {
    id?: string
    title: string
    updated?: ApiTypes.DateTimeType
    count?: number
}
