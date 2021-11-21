import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {IRestCurrent, IRestForecast, IRestSensors, IRestStatistic, IRestUptime, IStatisticRequest} from './types'

export const weatherApi = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery(
        { baseUrl: process.env.REACT_APP_API_HOST }),
    endpoints: (builder) => ({
        getSummary: builder.query<IRestCurrent, null>({
            query: () => 'current'
        }),
        getForecast: builder.query<IRestForecast, null>({
            query: () => 'forecast'
        }),
        getSensors: builder.query<IRestSensors, null>({
            query: () => 'sensors'
        }),
        getUptime: builder.query<IRestUptime, void>({
            query: () => 'uptime'
        }),
        getStatistic: builder.query<IRestStatistic, IStatisticRequest>({
            query: (params: IStatisticRequest) => `statistic?date_start=${params.start}&date_end=${params.end}&sensors=${params.sensors}`
        }),
    }),
})

// Export hooks for usage in functional components
export const { useGetSummaryQuery, useGetForecastQuery, useGetSensorsQuery, useGetStatisticQuery, useGetUptimeQuery } = weatherApi
