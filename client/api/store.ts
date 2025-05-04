import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

import { createWrapper } from 'next-redux-wrapper'
import { configureStore } from '@reduxjs/toolkit'

import applicationSlice from '@/api/applicationSlice'

import { API } from './api'

export const store = () =>
    configureStore({
        devTools: process.env.NODE_ENV !== 'production',
        middleware: (gDM) => gDM().concat(API.middleware),
        reducer: {
            application: applicationSlice,
            [API.reducerPath]: API.reducer
        }
    })

export type AppStore = ReturnType<typeof store>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
// export const useAppStore: () => AppStore = useStore

export const wrapper = createWrapper<AppStore>(store, { debug: false })
