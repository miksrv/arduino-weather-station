import * as types from './actionTypes'

const METEO_API = 'https://api.miksoft.pro/meteo/get/'

export function fetchDataSummary() {
    return async(dispatch) => {
        try {
            const url = `${METEO_API}summary`
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
            const url = `${METEO_API}forecast`
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

export function fetchDataStatistic() {
    return async(dispatch) => {
        try {
            const url = `${METEO_API}statistic`
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