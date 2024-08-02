import { Photo } from './Photo'
import { Place } from './Place'
import { Rating } from './Rating'
import { User } from './User'

import { ApiTypes } from '@/api/types'

export const ActivityTypes = {
    // Comment: 'comment',
    // Cover: 'cover',
    Edit: 'edit',
    Photo: 'photo',
    Place: 'place',
    Rating: 'rating'
} as const
export type ActivityEnum = (typeof ActivityTypes)[keyof typeof ActivityTypes]

export type Item = {
    type: ActivityEnum
    views?: number
    place?: Place
    photos?: Photo[]
    rating?: Rating
    author?: User
    created?: ApiTypes.DateTimeType
}
