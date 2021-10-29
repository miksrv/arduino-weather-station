import {ICurrentWeather, IRestResponse} from '../../api/types'

const payload: ICurrentWeather = {
    temperature: 12.3,
    temperature_feels: 3.4,
    humidity: 45.4,
    pressure: 747.2,
    wind_speed: 6.3,
    wind_degree: 230,
    clouds: 70,
    precipitation: 0.3
}

export const response: IRestResponse = {
    status: true,
    update: Date.now() / 1000 | 0,
    payload: payload
}

export default response