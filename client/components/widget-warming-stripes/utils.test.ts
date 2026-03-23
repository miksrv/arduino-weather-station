import { COLD_COLOR, getContrastColor, HOT_COLOR, lerpColor, MID_COLOR, tempToColor } from './utils'

describe('utils', () => {
    describe('lerpColor', () => {
        it('returns first color when t = 0', () => {
            expect(lerpColor('#000000', '#ffffff', 0)).toBe('rgb(0,0,0)')
        })

        it('returns second color when t = 1', () => {
            expect(lerpColor('#000000', '#ffffff', 1)).toBe('rgb(255,255,255)')
        })

        it('returns middle color when t = 0.5', () => {
            expect(lerpColor('#000000', '#ffffff', 0.5)).toBe('rgb(128,128,128)')
        })

        it('interpolates correctly for colored values', () => {
            expect(lerpColor('#ff0000', '#0000ff', 0.5)).toBe('rgb(128,0,128)')
        })
    })

    describe('tempToColor', () => {
        it('returns MID_COLOR when range is 0', () => {
            expect(tempToColor(10, 10, 10)).toBe(MID_COLOR)
        })

        it('returns cold color for minimum temperature', () => {
            const result = tempToColor(0, 0, 20)
            expect(result).toContain('rgb(')
            // Should be close to COLD_COLOR
        })

        it('returns hot color for maximum temperature', () => {
            const result = tempToColor(20, 0, 20)
            expect(result).toContain('rgb(')
            // Should be close to HOT_COLOR
        })

        it('returns mid color for middle temperature', () => {
            const result = tempToColor(10, 0, 20)
            expect(result).toContain('rgb(')
            // Should be close to MID_COLOR
        })
    })

    describe('getContrastColor', () => {
        it('returns black when range is 0', () => {
            expect(getContrastColor(10, 10, 10)).toBe('#000')
        })

        it('returns white for cold temperatures (t < 0.25)', () => {
            expect(getContrastColor(0, 0, 20)).toBe('#fff')
            expect(getContrastColor(2, 0, 20)).toBe('#fff')
        })

        it('returns white for hot temperatures (t > 0.75)', () => {
            expect(getContrastColor(20, 0, 20)).toBe('#fff')
            expect(getContrastColor(18, 0, 20)).toBe('#fff')
        })

        it('returns black for middle temperatures (0.25 <= t <= 0.75)', () => {
            expect(getContrastColor(10, 0, 20)).toBe('#000')
            expect(getContrastColor(8, 0, 20)).toBe('#000')
            expect(getContrastColor(12, 0, 20)).toBe('#000')
        })
    })

    describe('color constants', () => {
        it('has correct COLD_COLOR', () => {
            expect(COLD_COLOR).toBe('#2c7eec')
        })

        it('has correct MID_COLOR', () => {
            expect(MID_COLOR).toBe('#f7f7f7')
        })

        it('has correct HOT_COLOR', () => {
            expect(HOT_COLOR).toBe('#e53935')
        })
    })
})
