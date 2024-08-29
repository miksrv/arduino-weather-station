export * as Current from './current'
export * as History from './history'
export * as Forecast from './forecast'

export type Locale = 'en' | 'ru'

export interface ResError {
    status?: number
    code?: number
    messages?: any
}
