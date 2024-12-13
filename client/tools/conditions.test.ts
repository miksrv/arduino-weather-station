import { getWeatherI18nKey } from './conditions'

describe('conditions', () => {
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
