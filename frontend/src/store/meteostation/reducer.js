import * as types from './actionTypes'

const initialState = {
    storeSummary: {},
    storeForecast: {},
    storeStatistic: {},
    storeKIndexStat: {},
    storeHeatMap: {}
}

export default function reduce(state = initialState, action = {}) {
    switch (action.type) {
        case types.GET_SUMMARY:
            return {
                ...state,
                storeSummary: action.payload
            }

        case types.GET_FORECAST:
            return {
                ...state,
                storeForecast: action.payload
            }

        case types.GET_STATISTIC:
            return {
                ...state,
                storeStatistic: action.payload
            }

        case types.GET_KINDEX:
            return {
                ...state,
                storeKIndexStat: action.payload
            }

        case types.GET_HEATMAP:
            return {
                ...state,
                storeHeatMap: action.payload
            }

        case types.CLEAR_HEATMAP:
            return {
                ...state,
                storeHeatMap: []
            }

        default:
            return state
    }
}