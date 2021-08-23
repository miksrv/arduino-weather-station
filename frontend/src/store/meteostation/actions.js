import * as types from './actionTypes'

const hostAPI = process.env.REACT_APP_API_HOST

export function fetchDataSummary() {
    return async(dispatch) => {
        try {
            const url = `${hostAPI}summary`
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            const payload = await response.json()

            dispatch({ type: types.GET_SUMMARY, payload })
        } catch (error) {
            console.error(error)
        }
    }
}

export function fetchDataForecast() {
    return async(dispatch) => {
        try {
            const url = `${hostAPI}forecast`
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            const payload = await response.json()

            dispatch({ type: types.GET_FORECAST, payload })
        } catch (error) {
            console.error(error)
        }
    }
}

export function fetchDataStatistic(start = null, end = null) {
    return async(dispatch) => {
        try {
            const range = (start !== null && end !== null) ? `?date_start=${start}&date_end=${end}` : ``
            const url   = `${hostAPI}statistic${range}`
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            const payload = await response.json()

            dispatch({ type: types.GET_STATISTIC, payload })
        } catch (error) {
            console.error(error)
        }
    }
}

export function fetchDataKIndex() {
    return async(dispatch) => {
        try {
            const url   = `${hostAPI}kindex`
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            const payload = await response.json()

            dispatch({ type: types.GET_KINDEX, payload })
        } catch (error) {
            console.error(error)
        }
    }
}

export function fetchHeatMap(start = null, end = null) {
    return async(dispatch) => {
        try {
            const range = (start !== null && end !== null) ? `?date_start=${start}&date_end=${end}` : ``
            const url   = `${hostAPI}heatmap${range}`
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            const payload = await response.json()

            dispatch({ type: types.GET_HEATMAP, payload })
        } catch (error) {
            console.error(error)
        }
    }
}

export function clearHeatMap() {
    return async(dispatch) => {
        dispatch({ type: types.CLEAR_HEATMAP })
    }
}