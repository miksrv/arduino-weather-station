import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import {
    IRestCurrent,
    IRestForecast,
    IRestSensors,
    IRestStatistic,
    IRestUptime,
    IStatisticRequest
} from './types'

export const weatherApi = createApi({
    baseQuery: fetchBaseQuery({ baseUrl: process.env.REACT_APP_API_HOST }),
    endpoints: (builder) => ({
        getForecast: builder.query<IRestForecast, null>({
            query: () => 'forecast'
        }),

        getHeatmap: builder.query<IRestStatistic, IStatisticRequest>({
            keepUnusedDataFor: 0,
            query: (params: IStatisticRequest) =>
                `heatmap?date_start=${params.start}` +
                `&date_end=${params.end}&sensors=${params.sensors}`
        }),

        getSensors: builder.query<IRestSensors, null>({
            query: () => 'sensors'
        }),

        getStatistic: builder.query<IRestStatistic, IStatisticRequest>({
            keepUnusedDataFor: 0,
            query: (params: IStatisticRequest) =>
                `statistic?date_start=${params.start}` +
                `&date_end=${params.end}&sensors=${params.sensors}`
        }),

        getSummary: builder.query<IRestCurrent, null>({
            query: () => 'current'
        }),

        getUptime: builder.query<IRestUptime, void>({
            query: () => 'uptime'
        }),

        getWindRose: builder.query<IRestStatistic, IStatisticRequest>({
            keepUnusedDataFor: 0,
            query: (params: IStatisticRequest) =>
                `wind_rose?date_start=${params.start}&date_end=${params.end}`
        })
    }),
    reducerPath: 'api'
})

// Export hooks for usage in functional components
export const {
    useGetSummaryQuery,
    useGetForecastQuery,
    useGetSensorsQuery,
    useGetStatisticQuery,
    useGetWindRoseQuery,
    useGetUptimeQuery,
    useGetHeatmapQuery
} = weatherApi
