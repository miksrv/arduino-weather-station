import { HYDRATE } from 'next-redux-wrapper'
import type { Action, PayloadAction } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { ApiType } from '@/api'
import { RootState } from '@/api/store'
import { APIErrorType, Maybe } from '@/api/types'
import { encodeQueryData } from '@/tools/helpers'

const isHydrateAction = (action: Action): action is PayloadAction<RootState> => action.type === HYDRATE

export const urlAPI = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8080/'

const extractErrorMessage = (response: FetchBaseQueryError): string | undefined =>
    (response.data as APIErrorType | undefined)?.messages?.error

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
            transformErrorResponse: extractErrorMessage
        }),
        getHistory: builder.query<ApiType.History.Response, Maybe<ApiType.History.Request>>({
            providesTags: ['History'],
            query: (params) => `history${encodeQueryData<ApiType.History.Request>(params)}`,
            transformErrorResponse: extractErrorMessage
        }),
        getHeatmap: builder.query<ApiType.Heatmap.Response, Maybe<ApiType.Heatmap.Request>>({
            providesTags: ['Heatmap'],
            query: (params) => `heatmap${encodeQueryData<ApiType.Heatmap.Request>(params)}`,
            transformErrorResponse: extractErrorMessage
        }),
        getForecast: builder.query<ApiType.Forecast.Response, 'hourly' | 'daily'>({
            providesTags: ['Forecast'],
            query: (period) => `forecast/${period}`,
            transformErrorResponse: extractErrorMessage
        }),
        getAnomaly: builder.query<ApiType.Anomaly.AnomalyResponse, void>({
            providesTags: ['Anomaly'],
            query: () => 'anomaly',
            transformErrorResponse: extractErrorMessage
        }),
        getAnomalyHistory: builder.query<ApiType.Anomaly.AnomalyHistoryResponse, ApiType.Anomaly.AnomalyHistoryRequest>(
            {
                providesTags: ['Anomaly'],
                query: (params) => `anomaly/history${encodeQueryData<ApiType.Anomaly.AnomalyHistoryRequest>(params)}`,
                transformErrorResponse: extractErrorMessage
            }
        ),
        getPrecipitation: builder.query<ApiType.Precipitation.Response, ApiType.Precipitation.Request>({
            providesTags: ['Precipitation'],
            query: (params) => `precipitation${encodeQueryData<ApiType.Precipitation.Request>(params)}`,
            transformErrorResponse: extractErrorMessage
        }),
        getClimate: builder.query<ApiType.Climate.Response, void>({
            providesTags: ['Climate'],
            query: () => 'climate',
            transformErrorResponse: extractErrorMessage
        })
    }),
    // The `any` return type is intentional: adding an explicit return type annotation causes
    // TypeScript to widen the `Definitions` generic and break all endpoint hook inference.
    // This is a known limitation of the RTK Query + next-redux-wrapper circular dependency
    // (api.ts → RootState → store.ts → API → api.ts). Resolving it requires extracting the
    // store type derivation to a separate file so it no longer circularly depends on `api.ts`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extractRehydrationInfo(action, { reducerPath }): any {
        if (isHydrateAction(action)) {
            return action.payload[reducerPath]
        }
    },
    reducerPath: 'api',
    tagTypes: ['Current', 'History', 'Heatmap', 'Forecast', 'Anomaly', 'Precipitation', 'Climate']
})
