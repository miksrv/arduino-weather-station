import { Photo as PhotoType } from '@/api/types/Photo'
import { Categories, Place as PlaceType } from '@/api/types/Place'

export type Place = Pick<PlaceType, 'lat' | 'lon' | 'distance'> & {
    id?: string
    type?: 'cluster' | 'point'
    count?: number
    category: Categories
}

export type Photo = Pick<PhotoType, 'title' | 'preview' | 'full' | 'placeId' | 'author' | 'created'> & {
    type?: 'cluster' | 'point'
    count?: number
    lat: number
    lon: number
}
