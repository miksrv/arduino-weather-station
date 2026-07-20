import { IconTypes } from 'simple-react-ui-kit'

import { ApiType } from '@/api'
import { anomalyTypeToI18nKey } from '@/tools/conditions'
import { round } from '@/tools/helpers'
import { convertHpaToMmHg, getWindDirectionI18nKey } from '@/tools/weather'

export type EventCategory =
    | 'temperature-up'
    | 'temperature-down'
    | 'pressure'
    | 'wind'
    | 'precipitation'
    | 'system-ok'
    | 'system-stale'
    | 'anomaly'

export interface EventDisplay {
    icon: IconTypes
    category: EventCategory
    message: string
}

type TranslateFn = (key: string, options?: Record<string, unknown>) => string

/**
 * Maps a structured event from the /events feed to the icon, colour category, and localized
 * sentence used to render it — keeps that branching out of the presentational component.
 *
 * @param event The event to display.
 * @param t The translation function from useTranslation().
 */
export const getEventDisplay = (event: ApiType.Events.Event, t: TranslateFn): EventDisplay => {
    switch (event.type) {
        case 'temperature_change':
            return {
                icon: event.direction === 'down' ? 'ArrowDown' : 'ArrowUp',
                category: event.direction === 'down' ? 'temperature-down' : 'temperature-up',
                message: t(`event-temperature-${event.direction}`, { value: round(event.value, 1) })
            }

        case 'pressure_change':
            return {
                icon: event.direction === 'down' ? 'ArrowDown' : 'ArrowUp',
                category: 'pressure',
                message: t(`event-pressure-${event.direction}`, { value: convertHpaToMmHg(event.value) })
            }

        case 'wind_gust':
            return {
                icon: 'Wind',
                category: 'wind',
                message: t('event-wind-gust', {
                    value: round(event.value, 1),
                    direction: t(getWindDirectionI18nKey(event.windDeg ?? undefined))
                })
            }

        case 'precipitation':
            return {
                icon: 'WaterDrop',
                category: 'precipitation',
                message: t('event-precipitation', { value: round(event.value, 1) })
            }

        case 'system_status':
            return event.status === 'stale'
                ? { icon: 'ReportError', category: 'system-stale', message: t('event-system-stale') }
                : { icon: 'CheckCircle', category: 'system-ok', message: t('event-system-ok') }

        case 'anomaly_started':
            return {
                icon: 'ReportError',
                category: 'anomaly',
                message: t('event-anomaly-started', { name: t(`anomaly-${anomalyTypeToI18nKey(event.anomalyType)}`) })
            }

        case 'anomaly_ended':
            return {
                icon: 'ReportError',
                category: 'anomaly',
                message: t('event-anomaly-ended', { name: t(`anomaly-${anomalyTypeToI18nKey(event.anomalyType)}`) })
            }
    }
}
