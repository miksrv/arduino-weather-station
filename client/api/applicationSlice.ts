import { setCookie } from 'cookies-next'

import i18Config from '../next-i18next.config'

import { ApiTypes } from '@/api/types'
import { LOCAL_STORAGE } from '@/tools/constants'
import * as LocalStorage from '@/tools/localstorage'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type ApplicationStateProps = {
    showOverlay?: boolean
    showAuthDialog?: boolean
    userLocation?: ApiTypes.LatLonCoordinate
    locale?: ApiTypes.LocaleType
}

export const getStorageLocale = (): string | undefined =>
    typeof window !== 'undefined'
        ? (LocalStorage.getItem(LOCAL_STORAGE.LOCALE as any) ?? i18Config.i18n.defaultLocale)
        : i18Config.i18n.defaultLocale

const applicationSlice = createSlice({
    initialState: {
        locale: getStorageLocale(),
        showAuthDialog: false,
        showOverlay: false
    } as ApplicationStateProps,
    name: 'application',
    reducers: {
        closeAuthDialog: (state) => {
            state.showOverlay = false
            state.showAuthDialog = false
        },
        openAuthDialog: (state) => {
            state.showOverlay = true
            state.showAuthDialog = true
        },
        setLocale: (state, { payload }: PayloadAction<ApiTypes.LocaleType>) => {
            state.locale = payload
        },
        setUserLocation: (state, { payload }: PayloadAction<ApiTypes.LatLonCoordinate>) => {
            setCookie(LOCAL_STORAGE.LOCATION, `${payload.lat};${payload.lon}`)

            state.userLocation = payload
        },
        toggleOverlay: (state, { payload }: PayloadAction<boolean>) => {
            state.showOverlay = payload
        }
    }
})

export const { toggleOverlay, closeAuthDialog, openAuthDialog, setLocale, setUserLocation } = applicationSlice.actions

export default applicationSlice.reducer
