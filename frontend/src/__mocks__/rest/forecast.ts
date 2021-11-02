import { IRestResponse, IForecastItem } from '../../app/types'

const payload: IForecastItem[] = [
    {
        time: (Date.now() / 1000) + 5000 | 0,
        condition_id: 800,
        temperature: 5,
        clouds: 30,
        precipitation: 0
    },
    {
        time: (Date.now() / 1000) + 10000 | 0,
        condition_id: 500,
        temperature: 7,
        clouds: 45,
        precipitation: 0
    },
    {
        time: (Date.now() / 1000) + 15000 | 0,
        condition_id: 500,
        temperature: 6.5,
        clouds: 39,
        precipitation: 0
    },
    {
        time: (Date.now() / 1000) + 20000 | 0,
        condition_id: 500,
        temperature: 10,
        clouds: 80,
        precipitation: 0
    },
]


export const response: IRestResponse = {
    status: true,
    timestamp: {
        server: Date.now() / 1000 | 0,
        update:  (Date.now() / 1000) - 120 | 0
    },
    payload: payload
}

export default response