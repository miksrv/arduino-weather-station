import translate from '../functions/translate'
import { declOfNum, degToCompass, timeAgo } from '../functions/helpers'

describe('Test helper functions', () => {
    it('declOfNum', () => {
        const words = ['день', 'дня', 'дней']

        expect(declOfNum(101, words)).toBe('день')
        expect(declOfNum(22, words)).toBe('дня')
        expect(declOfNum(47, words)).toBe('дней')
    })

    it('degToCompass', () => {
        const lang = translate().weather.wind_direction

        expect(degToCompass(22.5, lang)).toBe('North northeast')
        expect(degToCompass(106, lang)).toBe('East-southeast')
        expect(degToCompass(37, lang)).toBe('Northeast')
        expect(degToCompass(201, lang)).toBe('South southwest')
        expect(degToCompass(317, lang)).toBe('Northwest')
        expect(degToCompass(357, lang)).toBe('North')
    })

    it('timeAgo', () => {
        const lang = translate().timeago

        expect(timeAgo(0, lang)).toBe('updated recently')
        expect(timeAgo(3631, lang)).toBe('01 h. 31 sec. ago')
    })
})