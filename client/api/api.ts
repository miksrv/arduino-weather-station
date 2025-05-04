import { HYDRATE } from 'next-redux-wrapper'
import type { Action, PayloadAction } from '@reduxjs/toolkit'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { ApiType } from '@/api'
import { RootState } from '@/api/store'
import { APIErrorType, Maybe } from '@/api/types'
import { encodeQueryData } from '@/tools/helpers'

const isHydrateAction = (action: Action): action is PayloadAction<RootState> => action.type === HYDRATE

export const urlAPI = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8080/'

// export const isApiValidationErrors = <T>(response: unknown): response is ApiTypes.ApiResponseError<T> =>
//     typeof response === 'object' &&
//     response != null &&
//     'messages' in response &&
//     typeof (response as any).messages === 'object'

export const API = createApi({
    baseQuery: fetchBaseQuery({
        baseUrl: urlAPI,
        prepareHeaders: (headers, { getState }) => {
            const locale = (getState() as RootState).application.locale

            if (locale) {
                headers.set('Locale', locale)
            }

            return headers
        }
    }),
    endpoints: (builder) => ({
        getCurrent: builder.query<ApiType.Current.Response, void>({
            providesTags: ['Current'],
            query: () => 'current',
            transformErrorResponse: (response) => (response.data as APIErrorType).messages.error
        }),
        getHistory: builder.query<ApiType.History.Response, Maybe<ApiType.History.Request>>({
            providesTags: ['History'],
            query: (params) => `history${encodeQueryData<ApiType.History.Request>(params)}`,
            transformErrorResponse: (response) => (response.data as APIErrorType).messages.error
        }),
        getHeatmap: builder.query<ApiType.Heatmap.Response, Maybe<ApiType.Heatmap.Request>>({
            providesTags: ['Heatmap'],
            query: (params) => `heatmap${encodeQueryData<ApiType.Heatmap.Request>(params)}`,
            transformErrorResponse: (response) => (response.data as APIErrorType).messages.error
        }),
        getForecast: builder.query<ApiType.Forecast.Response, 'hourly' | 'daily'>({
            providesTags: ['Forecast'],
            query: (period) => `forecast/${period}`,
            transformErrorResponse: (response) => (response.data as APIErrorType).messages.error
        })
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extractRehydrationInfo(action, { reducerPath }): any {
        if (isHydrateAction(action)) {
            return action.payload[reducerPath]
        }
    },
    reducerPath: 'api',
    tagTypes: ['Current', 'History', 'Heatmap', 'Forecast']
})
