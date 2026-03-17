import { anomalyTypeToI18nKey, getWeatherI18nKey } from './conditions'

describe('conditions', () => {
    describe('anomalyTypeToI18nKey', () => {
        it('replaces underscores with hyphens', () => {
            expect(anomalyTypeToI18nKey('heat_wave')).toBe('heat-wave')
        })

        it('handles multiple underscores', () => {
            expect(anomalyTypeToI18nKey('drought_spi_30')).toBe('drought-spi-30')
        })

        it('returns the string unchanged when there are no underscores', () => {
            expect(anomalyTypeToI18nKey('heatwave')).toBe('heatwave')
        })

        it('handles an empty string', () => {
            expect(anomalyTypeToI18nKey('')).toBe('')
        })
    })


    it('returns "conditions.unknown" when weatherId is undefined', () => {
        expect(getWeatherI18nKey(undefined)).toBe('conditions.unknown')
    })

    it('returns the correct i18n key for a valid weatherId', () => {
        expect(getWeatherI18nKey(200)).toBe('conditions.thunderstorm_with_light_rain')
        expect(getWeatherI18nKey(800)).toBe('conditions.clear_sky')
    })

    it('returns "conditions.unknown" for an invalid weatherId', () => {
        expect(getWeatherI18nKey(999)).toBe('conditions.unknown')
    })

    it('handles weatherId as a string', () => {
        expect(getWeatherI18nKey('200')).toBe('conditions.thunderstorm_with_light_rain')
        expect(getWeatherI18nKey('800')).toBe('conditions.clear_sky')
    })
})
