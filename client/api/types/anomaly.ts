export type RiskLevel = 'low' | 'elevated' | 'high' | 'critical'
export type RiskSeason = 'active' | 'offseason'

export interface FloodRiskComponent {
    value: number
    weight: number
    contribution: number
}

export interface FloodRisk {
    score: number
    level: RiskLevel
    components: {
        sweAnomaly: FloodRiskComponent
        meltRate: FloodRiskComponent
        rainOnSnowDays: FloodRiskComponent
        precipAnomaly: FloodRiskComponent
        temperatureTrend: FloodRiskComponent
    }
    disclaimer: string
    season: RiskSeason
    dataQuality: 'good' | 'insufficient'
}

export interface SnowpackPoint {
    date: string
    swe: number
}

export interface TemperaturePoint {
    date: string
    temperature: number
}

export interface SeasonComparison {
    year: string
    maxSWE: number
    floodOccurred: boolean | null
    series: SnowpackPoint[]
    peakDate: string | null
    temperatureSeries: TemperaturePoint[]
}

export interface Snowpack {
    estimatedSWE: number
    historicalAvgSWE: number
    historicalStdSWE: number
    sweZScore: number
    series: SnowpackPoint[]
    comparisonYears: SeasonComparison[]
    temperatureSeries: TemperaturePoint[]
}

export interface ParameterZScores {
    temperature: number
    pressure: number
    precipitation: number
    windSpeed: number
    humidity: number
    uvIndex: number
}

export interface AnomalyCalendarPoint {
    date: string
    activeCount: number
    types: string[]
}

export interface AnomalyState {
    id: string
    active: boolean
    triggeredAt?: string
    lastTriggered?: string
    currentZScore?: number
    extraMetric?: { label: string; value: number }
}

export interface AnomalyHistoryEntry {
    id: string
    type: string
    startDate: string
    endDate: string | null
    peakValue: number | null
    description: string
}

export interface AnomalyResponse {
    floodRisk: FloodRisk
    snowpack: Snowpack
    parameterZScores: ParameterZScores
    anomalies: AnomalyState[]
    anomalyHistory: AnomalyHistoryEntry[]
    anomalyCalendar: AnomalyCalendarPoint[]
}

export interface AnomalyHistoryRequest {
    season: string
}

export interface AnomalyHistoryResponse {
    season: string
    series: SnowpackPoint[]
}
