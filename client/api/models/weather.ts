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
