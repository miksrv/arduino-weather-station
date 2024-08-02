import { Item } from './Activity'
import { Notification } from './Notification'
import { Photo } from './Photo'
import { Categories, Category, GeoSearchLocation, LocationObject, Place } from './Place'
import { Photo as poiPhoto, Place as poiPlace } from './Placemark'
import { Tag } from './Tag'
import { LevelData, User } from './User'

import { Comments } from '@/api/types/Comments'

/** General Types **/
export type LatLonCoordinate = {
    lat: number
    lon: number
}

export type DateTimeType = {
    date: string
    timezone_type: number
    timezone: string
}

export type SitemapItem = {
    id: string
    updated: DateTimeType
}

export type PlaceLocationType = {
    title: string
    value: number
    type: LocationType
}

export type AuthServiceType = 'google' | 'yandex' | 'vk' | 'native'

export type LocaleType = 'en' | 'ru'

export const SortOrders = {
    ASC: 'ASC',
    DESC: 'DESC'
} as const
export type SortOrdersType = (typeof SortOrders)[keyof typeof SortOrders]

export const SortFields = {
    Bookmarks: 'bookmarks',
    Category: 'category',
    Comments: 'comments',
    Created: 'created_at',
    Distance: 'distance',
    Rating: 'rating',
    Updated: 'updated_at',
    Views: 'views'
} as const
export type SortFieldsType = (typeof SortFields)[keyof typeof SortFields]

export const LocationType = {
    Country: 'country',
    District: 'district',
    Locality: 'locality',
    Region: 'region'
} as const
export type LocationType = (typeof LocationType)[keyof typeof LocationType]

export type LocationTypes = 'country' | 'region' | 'district' | 'locality'

export interface ApiResponseError<T> {
    status: number
    error: number
    messages: Record<keyof T, any>
}

export interface RequestAuthLogin {
    email?: string
    password?: string
}

export interface RequestAuthService {
    service: AuthServiceType
    code?: string
    state?: string
    device_id?: string
}

export interface ResponseAuthLogin {
    session?: string
    redirect?: string
    token?: string
    auth?: boolean
    user?: User
}

export interface RequestAuthRegistration {
    name?: string
    email?: string
    password?: string
}

/* Controller: Places */
export interface RequestPlacesGetItem {
    id: string
    lat?: number | null
    lon?: number | null
}

export interface ResponsePlacesGetItem extends Place {}

export interface ResponsePlacesGetList {
    items?: Place[]
    count?: number
}

export interface RequestPlacesGetList {
    sort?: SortFieldsType
    order?: SortOrdersType
    bookmarkUser?: string
    author?: string
    lat?: number | null
    lon?: number | null
    tag?: string | null
    search?: string
    country?: number | null
    region?: number | null
    district?: number | null
    locality?: number | null
    limit?: number
    offset?: number
    category?: string | null
    excludePlaces?: string[]
}

export interface RequestPlacesPatchCover {
    x: number
    y: number
    width: number
    height: number
    placeId: string
    photoId: string
}

export interface ResponsePlacesPatchItem {
    content?: string
    tags?: string[]
}

export interface RequestPlacesPostItem {
    id?: string
    title?: string
    content?: string
    category?: string
    tags?: string[]
    lat?: number
    lon?: number
}

export interface ResponsePlacesPostItem {
    id: string
}

/* Controller: Photos */
export interface ResponsePhotoDeleteItem {
    id?: string
}

export interface ResponsePhotoRotateItem {
    id?: string
    full?: string
    preview?: string
}

export interface ResponsePhotosGetList {
    items?: Photo[]
    count?: number
}

export interface RequestPhotosGetList {
    limit?: number
    offset?: number
    author?: string
    place?: string
}

export interface ResponsePhotoPostUpload extends Photo {}

export interface RequestPhotoPostUpload {
    formData?: FormData
    place?: string
    count?: number
}

/* Controller: Location */
export interface ResponseLocationGetByType extends LocationObject {}

export interface RequestLocationGetByType {
    id?: number | null
    type?: LocationTypes
}

export interface ResponseLocationGetSearch {
    countries?: LocationObject[]
    regions?: LocationObject[]
    districts?: LocationObject[]
    cities?: LocationObject[]
}

export interface ResponseLocationGetGeoSearch {
    items?: GeoSearchLocation[]
}

/* Controller: Notifications */
export interface RequestNotificationsGetList {
    limit?: number
    offset?: number
}

export interface ResponseNotificationsGet {
    items?: Notification[]
    count?: number
}

/* Controller: Tags */
export interface ResponseTagsGetList {
    items?: Tag[]
}

export interface ResponseTagsGetSearch {
    items?: string[]
}

/* Controller: Sitemap */
export interface ResponseSitemapGet {
    places?: SitemapItem[]
    users?: SitemapItem[]
}

/* Controller: Categories */
export interface RequestCategoriesGetList {
    places?: boolean
}

export interface ResponseCategoriesGetList {
    items?: Category[]
}

/* Controller: Comments */
export interface RequestCommentsGetList {
    place?: string
}

export interface RequestCommentsPost {
    placeId?: string
    answerId?: string
    comment?: string
}

export interface ResponseCommentsGetList {
    items?: Comments[]
    count: number
}

/* Controller: Levels */
export interface ResponseLevelsGetList {
    awards?: {
        place?: number
        photo?: number
        rating?: number
        cover?: number
        edit?: number
        comment?: number
    }
    items?: Array<
        LevelData & {
            count?: number
            users?: Pick<User, 'id' | 'avatar' | 'name'>[]
        }
    >
}

/* Controller: Rating */
export interface ResponseRatingGetList {
    rating?: number
    count?: number
    vote?: number | null
}

export interface RequestRatingSet {
    place: string
    score: number
}

export interface ResponseRatingSet {
    rating: number
}

/* Controller: Bookmarks */
export interface RequestBookmarkSet {
    placeId: string
}
export interface RequestBookmarkGetCheck {
    placeId: string
}

export interface ResponseBookmarkGetCheck {
    result: boolean
}

/* Controller: Visited */
export interface RequestVisitedSet {
    place: string
}

export interface ResponseVisitedUsersList {
    items: User[]
}

/* Controller: Activity */
export interface ResponseActivityGetList {
    items: Item[]
}

export interface RequestActivityGetList {
    date?: string
    author?: string
    place?: string
    limit?: number
    offset?: number
}

/* Controller: POI */
export interface RequestPoiList {
    bounds?: string
    zoom?: number
    categories?: Categories[]
}

export interface ResponsePoiItem
    extends Pick<
        Place,
        'id' | 'rating' | 'title' | 'views' | 'photos' | 'cover' | 'comments' | 'bookmarks' | 'distance'
    > {}

export interface ResponsePoiPlacesList {
    items: poiPlace[]
    count: number
}
export interface ResponsePoiUsersList {
    items: string[][]
}

export interface ResponsePoiPhotosList {
    items: poiPhoto[]
    count: number
}

/* Controller: User */
export interface ResponseUsersGetList {
    items?: User[]
    count?: number
}

export interface RequestUsersGetList {
    limit?: number
    offset?: number
}

export interface RequestUsersCropAvatar {
    x: number
    y: number
    width: number
    height: number
    filename: string
}

export interface ResponseUsersCropAvatar {
    filepath: string
}

export interface RequestUsersPatch extends Pick<User, 'settings' | 'website'> {
    id?: string
    name?: string
    oldPassword?: string
    newPassword?: string
}

export interface ResponseUserUploadAvatar {
    filename: string
    filepath: string
    width: number
    height: number
}

export interface ResponseUsersGetItem extends User {}
