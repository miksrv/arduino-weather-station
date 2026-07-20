export type EventDirection = 'up' | 'down'

export type SystemStatus = 'ok' | 'stale'

export interface TemperatureChangeEvent {
    date: string
    type: 'temperature_change'
    direction: EventDirection
    value: number
}

export interface PressureChangeEvent {
    date: string
    type: 'pressure_change'
    direction: EventDirection
    value: number
}

export interface WindGustEvent {
    date: string
    type: 'wind_gust'
    value: number
    windDeg?: number | null
}

export interface PrecipitationEvent {
    date: string
    type: 'precipitation'
    value: number
}

export interface SystemStatusEvent {
    date: string
    type: 'system_status'
    status: SystemStatus
}

export interface AnomalyEvent {
    date: string
    type: 'anomaly_started' | 'anomaly_ended'
    anomalyType: string
}

export type Event =
    TemperatureChangeEvent | PressureChangeEvent | WindGustEvent | PrecipitationEvent | SystemStatusEvent | AnomalyEvent

export interface Response {
    events: Event[]
}

export interface Request {
    hours: number
    limit: number
}
