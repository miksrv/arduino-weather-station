import type { ApiType } from '@/api'

/** Set from package.json by next.config.js (env) */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION

/** How often the current readings are refreshed in the browser */
export const POLLING_INTERVAL_CURRENT = 10 * 60 * 1000

/** How often forecasts and anomalies are refreshed in the browser */
export const POLLING_INTERVAL_FORECAST = 10 * 60 * 1000

/** The event log of the sensors page; the page prefetches it on the server with the same arguments */
export const EVENTS_QUERY: ApiType.Events.Request = { hours: 24, limit: 50 }
