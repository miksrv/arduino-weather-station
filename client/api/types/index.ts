export * as Current from './current'
export * as History from './history'

export interface ResError {
    status?: number
    code?: number
    messages?: any
}

export interface DateTime {
    date: string
    timezone_type: number
    timezone: string
}
