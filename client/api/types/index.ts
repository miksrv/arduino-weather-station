export * as Current from './current'
export * as History from './history'
export * as Forecast from './forecast'

export type Locale = 'en' | 'ru'

export type Maybe<T> = T | void

export type APIErrorType = {
    messages: {
        error?: string
    }
}
