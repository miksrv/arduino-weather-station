export type Sensors = {
    temperature?: number
    feelsLike?: number
    pressure?: number
    humidity?: number
    dewPoint?: number
    visibility?: number
    uvIndex?: number
    solEnergy?: number
    solRadiation?: number
    clouds?: number
    precipitation?: number
    windSpeed?: number
    windGust?: number
    windDeg?: number
}

export type Weather = Sensors & {
    date?: string
    weatherId?: number
}

/**
 * A forecast row. Hourly rows carry the Weather fields; daily rows (one per local day) add the day's
 * extremes, and `precipitation` is the day's total.
 */
export type Forecast = Weather & {
    temperatureMin?: number
    temperatureMax?: number
    feelsLikeMin?: number
    feelsLikeMax?: number
    windSpeedMax?: number
    /** Hours of the day with at least 0.1 mm */
    precipitationHours?: number
}
