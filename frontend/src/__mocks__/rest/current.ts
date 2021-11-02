import {ICurrentWeather, IRestResponse} from '../../app/types'

const payload: ICurrentWeather = {
    condition_id: 800, // See https://openweathermap.org/weather-conditions
    temperature: 12.3,
    temperature_feels: 3.4,
    humidity: 45.4,
    pressure: 747.2,
    wind_speed: 6.3,
    wind_degree: 159,
    clouds: 70,
    precipitation: 0.3
}

export const response: IRestResponse = {
    status: true,
    timestamp: {
        server: Date.now() / 1000 | 0,
        update: (Date.now() / 1000) - 40 | 0,
    },
    payload: payload
}

export default response