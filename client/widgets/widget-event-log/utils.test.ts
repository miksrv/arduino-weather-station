import { ApiType } from '@/api'

import { getEventDisplay } from './utils'

const t = (key: string, options?: Record<string, unknown>) => (options ? `${key}:${JSON.stringify(options)}` : key)

describe('getEventDisplay', () => {
    it('maps a rising temperature_change event', () => {
        const event: ApiType.Events.Event = {
            date: '2024-01-01T00:00:00Z',
            type: 'temperature_change',
            direction: 'up',
            value: 0.6
        }
        const result = getEventDisplay(event, t)

        expect(result.icon).toBe('ArrowUp')
        expect(result.category).toBe('temperature-up')
        expect(result.message).toBe('event-temperature-up:{"value":0.6}')
    })

    it('maps a falling temperature_change event', () => {
        const event: ApiType.Events.Event = {
            date: '2024-01-01T00:00:00Z',
            type: 'temperature_change',
            direction: 'down',
            value: 0.4
        }
        const result = getEventDisplay(event, t)

        expect(result.icon).toBe('ArrowDown')
        expect(result.category).toBe('temperature-down')
        expect(result.message).toBe('event-temperature-down:{"value":0.4}')
    })

    it('converts pressure_change value from hPa to mmHg', () => {
        const event: ApiType.Events.Event = {
            date: '2024-01-01T00:00:00Z',
            type: 'pressure_change',
            direction: 'up',
            value: 1.2
        }
        const result = getEventDisplay(event, t)

        expect(result.icon).toBe('ArrowUp')
        expect(result.category).toBe('pressure')
        expect(result.message).toBe('event-pressure-up:{"value":0.9}')
    })

    it('maps a wind_gust event with a compass direction label', () => {
        const event: ApiType.Events.Event = {
            date: '2024-01-01T00:00:00Z',
            type: 'wind_gust',
            value: 8.5,
            windDeg: 315
        }
        const result = getEventDisplay(event, t)

        expect(result.icon).toBe('Wind')
        expect(result.category).toBe('wind')
        expect(result.message).toBe('event-wind-gust:{"value":8.5,"direction":"wind-direction-nw"}')
    })

    it('maps a precipitation event', () => {
        const event: ApiType.Events.Event = { date: '2024-01-01T00:00:00Z', type: 'precipitation', value: 0.3 }
        const result = getEventDisplay(event, t)

        expect(result.icon).toBe('WaterDrop')
        expect(result.category).toBe('precipitation')
        expect(result.message).toBe('event-precipitation:{"value":0.3}')
    })

    it('maps an ok system_status event', () => {
        const event: ApiType.Events.Event = { date: '2024-01-01T00:00:00Z', type: 'system_status', status: 'ok' }
        const result = getEventDisplay(event, t)

        expect(result.icon).toBe('CheckCircle')
        expect(result.category).toBe('system-ok')
        expect(result.message).toBe('event-system-ok')
    })

    it('maps a stale system_status event', () => {
        const event: ApiType.Events.Event = { date: '2024-01-01T00:00:00Z', type: 'system_status', status: 'stale' }
        const result = getEventDisplay(event, t)

        expect(result.icon).toBe('ReportError')
        expect(result.category).toBe('system-stale')
        expect(result.message).toBe('event-system-stale')
    })

    it('maps an anomaly_started event, translating the anomaly type', () => {
        const event: ApiType.Events.Event = {
            date: '2024-01-01T00:00:00Z',
            type: 'anomaly_started',
            anomalyType: 'heat_wave'
        }
        const result = getEventDisplay(event, t)

        expect(result.icon).toBe('ReportError')
        expect(result.category).toBe('anomaly')
        expect(result.message).toBe('event-anomaly-started:{"name":"anomaly-heat-wave"}')
    })

    it('maps an anomaly_ended event', () => {
        const event: ApiType.Events.Event = {
            date: '2024-01-01T00:00:00Z',
            type: 'anomaly_ended',
            anomalyType: 'cold_snap'
        }
        const result = getEventDisplay(event, t)

        expect(result.message).toBe('event-anomaly-ended:{"name":"anomaly-cold-snap"}')
    })
})
