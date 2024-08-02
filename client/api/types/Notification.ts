import { ApiTypes, User } from '@/api/types'
import { Place } from '@/api/types/Place'

export type ActivityType = 'photo' | 'place' | 'rating' | 'edit' | 'cover'

export type Types =
    | 'photo'
    | 'place'
    | 'rating'
    | 'edit'
    | 'cover'
    | 'experience'
    | 'level'
    | 'achievements'
    | 'success'
    | 'warning'
    | 'error'

export type ExperienceData = {
    value?: number
}

export type Notification = {
    id: string
    title?: string
    message?: string
    read?: boolean
    type?: Types
    meta?: User.LevelData & ExperienceData
    activity?: ActivityType
    place?: Pick<Place, 'id' | 'title' | 'cover'>
    created?: ApiTypes.DateTimeType
}
