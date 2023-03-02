import { IForecastItem, IRestResponse } from '../../app/types'

const payload: IForecastItem[] = [
    {
        clouds: 30,
        condition_id: 800,
        precipitation: 0,
        temperature: 5,
        time: (Date.now() / 1000 + 5000) | 0
    },
    {
        clouds: 45,
        condition_id: 500,
        precipitation: 0,
        temperature: 7,
        time: (Date.now() / 1000 + 10000) | 0
    },
    {
        clouds: 39,
        condition_id: 500,
        precipitation: 0,
        temperature: 6.5,
        time: (Date.now() / 1000 + 15000) | 0
    },
    {
        clouds: 80,
        condition_id: 500,
        precipitation: 0,
        temperature: 10,
        time: (Date.now() / 1000 + 20000) | 0
    }
]

export const response: IRestResponse = {
    payload: payload,
    status: true,
    timestamp: {
        server: (Date.now() / 1000) | 0,
        update: (Date.now() / 1000 - 120) | 0
    }
}

export default response
