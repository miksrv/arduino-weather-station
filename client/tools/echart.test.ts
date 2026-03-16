import { getEChartBaseConfig } from './echart'

describe('getEChartBaseConfig', () => {
    it('returns dark theme config by default', () => {
        const config = getEChartBaseConfig()
        expect(config.backgroundColor).toBe('#2c2d2e')
    })

    it('returns dark theme config when theme is "dark"', () => {
        const config = getEChartBaseConfig('dark')
        expect(config.backgroundColor).toBe('#2c2d2e')
    })

    it('returns light theme config when theme is "light"', () => {
        const config = getEChartBaseConfig('light')
        expect(config.backgroundColor).toBe('#ffffff')
    })

    it('returns correct grid config', () => {
        const config = getEChartBaseConfig('dark')
        expect(config.grid).toMatchObject({
            left: 10,
            right: 10,
            top: 15,
            bottom: 25,
            containLabel: true
        })
    })

    it('returns correct legend config for dark theme', () => {
        const config = getEChartBaseConfig('dark')
        expect(config.legend).toMatchObject({
            type: 'plain',
            orient: 'horizontal',
            left: 5,
            bottom: 0,
            itemWidth: 20,
            itemHeight: 2,
            icon: 'rect'
        })
        expect((config.legend as { textStyle: { color: string } }).textStyle.color).toBe('#e1e3e6')
    })

    it('returns correct legend config for light theme', () => {
        const config = getEChartBaseConfig('light')
        expect((config.legend as { textStyle: { color: string } }).textStyle.color).toBe('#000000E5')
    })

    it('uses dark border color for dark theme', () => {
        const config = getEChartBaseConfig('dark')
        expect((config.grid as { borderColor: string }).borderColor).toBe('#444546')
    })

    it('uses light border color for light theme', () => {
        const config = getEChartBaseConfig('light')
        expect((config.grid as { borderColor: string }).borderColor).toBe('#cbcccd')
    })
})
