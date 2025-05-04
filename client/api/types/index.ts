export * as Current from './current'
export * as Forecast from './forecast'
export * as Heatmap from './heatmap'
export * as History from './history'

export type Locale = 'en' | 'ru'

export type Maybe<T> = T | void

export type APIErrorType = {
    messages: {
        error?: string
    }
}
