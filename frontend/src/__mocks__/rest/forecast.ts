import { IRestResponse, IForecastItem } from '../../app/types'

const payload: IForecastItem[] = [
    {
        time: (Date.now() + 5000) / 1000 | 0,
        temperature: 5,
        clouds: 30,
        precipitation: 0
    },
    {
        time: (Date.now() + 10000) / 1000 | 0,
        temperature: 7,
        clouds: 45,
        precipitation: 0
    },
    {
        time: (Date.now() + 15000) / 1000 | 0,
        temperature: 6.5,
        clouds: 39,
        precipitation: 0
    },
    {
        time: (Date.now() + 20000) / 1000 | 0,
        temperature: 10,
        clouds: 80,
        precipitation: 0
    },
]


export const response: IRestResponse = {
    status: true,
    update: Date.now() / 1000 | 0,
    payload: payload
}

export default response