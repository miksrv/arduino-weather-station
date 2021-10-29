/**
 * Common REST response interface
 */
export interface IRestResponse {
    status: boolean,
    update: number,
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

export interface ICurrentWeather {
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
    'wind_speed' | 'wind_degree' | 'clouds' |
    'precipitation' | 'dewpoint'