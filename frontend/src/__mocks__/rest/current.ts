import { ICurrentWeather, IRestResponse } from '../../app/types'

const payload: ICurrentWeather = {
    clouds: 70,
    condition_id: 800,
    humidity: 45.4,
    precipitation: 0.3,
    pressure: 747.2,
    temperature: 12.3,
    temperature_feels: 3.4,
    wind_degree: 159,
    wind_speed: 6.3
}

export const response: IRestResponse = {
    payload: payload,
    status: true,
    timestamp: {
        server: (Date.now() / 1000) | 0,
        update: (Date.now() / 1000 - 40) | 0
    }
}

export default response
