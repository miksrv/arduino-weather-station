import translate from '../functions/translate'
import { declOfNum, degToCompass, timeAgo, getUrlParameter } from '../functions/helpers'
import {weatherConditions} from '../functions/weatherConditions'

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

    it('getUrlParameter', () => {
        expect(getUrlParameter('test')).toBe('')
    })

    it('weatherConditions', () => {
        const lang = translate().weather.conditions

        expect(weatherConditions(200, lang)).toEqual(expect.objectContaining({name: lang.id200}))
        expect(weatherConditions(300, lang)).toEqual(expect.objectContaining({name: lang.id300}))
        expect(weatherConditions(500, lang)).toEqual(expect.objectContaining({name: lang.id500}))
        expect(weatherConditions(502, lang)).toEqual(expect.objectContaining({name: lang.id502}))
        expect(weatherConditions(503, lang)).toEqual(expect.objectContaining({name: lang.id503}))
        expect(weatherConditions(504, lang)).toEqual(expect.objectContaining({name: lang.id504}))
        expect(weatherConditions(504, lang)).toEqual(expect.objectContaining({name: lang.id504}))
        expect(weatherConditions(511, lang)).toEqual(expect.objectContaining({name: lang.id511}))
        expect(weatherConditions(520, lang)).toEqual(expect.objectContaining({name: lang.id520}))
        expect(weatherConditions(522, lang)).toEqual(expect.objectContaining({name: lang.id522}))
        expect(weatherConditions(610, lang)).toEqual(expect.objectContaining({name: lang.id600}))
        expect(weatherConditions(777, lang)).toEqual(expect.objectContaining({name: lang.id741}))
        expect(weatherConditions(800, lang)).toEqual(expect.objectContaining({name: lang.id800}))
        expect(weatherConditions(801, lang)).toEqual(expect.objectContaining({name: lang.id801}))
        expect(weatherConditions(802, lang)).toEqual(expect.objectContaining({name: lang.id802}))
        expect(weatherConditions(803, lang)).toEqual(expect.objectContaining({name: lang.id803}))
        expect(weatherConditions(804, lang)).toEqual(expect.objectContaining({name: lang.id804}))
    })
})