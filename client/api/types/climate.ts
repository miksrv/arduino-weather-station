export interface ClimateYearStat {
    year: number
    avgTemp: number
    minTemp: number
    maxTemp: number
    tempAnomaly: number
    /** The running year: covers only part of the seasons, so it is not compared with full years */
    isPartial?: boolean
    totalPrecip: number
    precipDays: number
    frostDays: number
    hotDays: number
    heavyRainDays: number
    avgPressure: number
    avgHumidity: number
    avgWindSpeed: number
    avgClouds: number
}

export interface ClimateMonthlyNormal {
    month: number
    avgTemp: number
    minTemp: number
    maxTemp: number
    avgPrecip: number
    avgClouds: number
    avgWindSpeed: number
}

export interface Response {
    years: ClimateYearStat[]
    monthlyNormals: ClimateMonthlyNormal[]
    baselineAvgTemp: number
    availableYears: number[]
}
