import { anomalyTypeToI18nKey, getDuration } from './utils'

describe('getDuration', () => {
    it('returns empty string when endDate is null', () => {
        expect(getDuration('2024-01-01', null)).toBe('')
    })

    it('calculates duration in days between two dates', () => {
        expect(getDuration('2024-01-01', '2024-01-11')).toBe('10d')
    })

    it('returns 0d for same-day start and end', () => {
        expect(getDuration('2024-06-15', '2024-06-15')).toBe('0d')
    })

    it('handles single day duration', () => {
        expect(getDuration('2024-03-01', '2024-03-02')).toBe('1d')
    })

    it('rounds fractional days', () => {
        expect(getDuration('2024-01-01T00:00:00Z', '2024-01-01T18:00:00Z')).toBe('1d')
    })
})

describe('anomalyTypeToI18nKey', () => {
    it('replaces underscores with hyphens', () => {
        expect(anomalyTypeToI18nKey('heat_wave')).toBe('heat-wave')
    })

    it('replaces multiple underscores', () => {
        expect(anomalyTypeToI18nKey('late_spring_frost')).toBe('late-spring-frost')
    })

    it('returns already-hyphenated string unchanged', () => {
        expect(anomalyTypeToI18nKey('cold-snap')).toBe('cold-snap')
    })

    it('returns empty string unchanged', () => {
        expect(anomalyTypeToI18nKey('')).toBe('')
    })

    it('handles string with no underscores or hyphens', () => {
        expect(anomalyTypeToI18nKey('drought')).toBe('drought')
    })
})
