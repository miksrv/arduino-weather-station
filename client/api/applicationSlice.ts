import i18Config from '../next-i18next.config'

import { LOCAL_STORAGE } from '@/tools/constants'
import * as LocalStorage from '@/tools/localstorage'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type ApplicationStateProps = {
    locale?: 'ru' | 'en' | string
    showOverlay?: boolean
}

export const getStorageLocale = (): string | undefined =>
    typeof window !== 'undefined'
        ? (LocalStorage.getItem(LOCAL_STORAGE.LOCALE as any) ?? i18Config.i18n.defaultLocale)
        : i18Config.i18n.defaultLocale

const applicationSlice = createSlice({
    initialState: {
        locale: getStorageLocale()
    } as ApplicationStateProps,
    name: 'application',
    reducers: {
        setLocale: (state, { payload }: PayloadAction<'ru' | 'en' | string>) => {
            state.locale = payload
        },
        toggleOverlay: (state, { payload }: PayloadAction<boolean>) => {
            state.showOverlay = payload
        }
    }
})

export const { setLocale, toggleOverlay } = applicationSlice.actions

export default applicationSlice.reducer
