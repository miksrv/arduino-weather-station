import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { IRestCurrent, IRestForecast, IRestSensors } from './types'

export const weatherApi = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery(
        { baseUrl: 'https://meteo.miksoft.pro/api/get/' }),
    endpoints: (builder) => ({
        getSummary: builder.query<IRestCurrent, null>({
            query: () => 'current'
        }),
        getForecast: builder.query<IRestForecast, null>({
            query: () => 'forecast'
        }),
        getSensors: builder.query<IRestSensors, null>({
            query: () => 'sensors'
        })
    }),
})

// Export hooks for usage in functional components
export const { useGetSummaryQuery, useGetForecastQuery, useGetSensorsQuery } = weatherApi
