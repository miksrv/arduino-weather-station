export interface IRestResponse {
    status: boolean,
    timestamp: {
        server: number,
        update: number,
    }
    payload?: any,
    errorText?: string,
}

export interface IRestCurrent extends IRestResponse {
    payload: ICurrentWeather
}

export interface IRestForecast extends IRestResponse {
    payload: IForecastItem[]
}

export interface IRestSensors extends IRestResponse {
    payload: ISensorItem[]
}

export interface IRestUptime extends IRestResponse {
    payload: number
}

export interface IRestStatistic extends IRestResponse {
    payload: any
}

export interface IStatisticRequest {
    start: string,
    end: string,
    sensors: SensorTypes[]
}

export interface ICurrentWeather {
    condition_id: number,
    temperature: number,
    temperature_feels: number,
    humidity: number,
    pressure: number,
    wind_speed: number,
    wind_degree: number,
    clouds: number,
    precipitation: number
}

export interface IForecastItem {
    time: number,
    condition_id: number,
    temperature: number,
    clouds: number,
    precipitation: number
}

export interface ISensorItem {
    name: string, // Имя (ID) датчика
    value: number, // Текущее значение
    trend?: number, // Изменение за тайминг
    min?: number,
    max?: number,
    type: SensorTypes, // Тип датчика (для стилизации на UI)
}

export type SensorTypes =
    'temperature' | 'humidity' | 'pressure' |
    'wind_speed' | 'wind_gust' | 'wind_deg' |
    'clouds' | 'precipitation' | 'dewpoint' |
    'illumination' | 'uvindex' | 'feels_like'