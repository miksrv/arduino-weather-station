import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { LocaleType } from '@/tools/types'

import i18Config from '../next-i18next.config'

type ApplicationStateProps = {
    locale?: LocaleType
    showOverlay?: boolean
}

const applicationSlice = createSlice({
    initialState: { locale: i18Config.i18n.defaultLocale } as ApplicationStateProps,
    name: 'application',
    reducers: {
        setLocale: (state, { payload }: PayloadAction<LocaleType>) => {
            state.locale = payload
        }
    }
})

export const { setLocale } = applicationSlice.actions

export default applicationSlice.reducer
