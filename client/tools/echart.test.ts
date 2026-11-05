import { getChartTokens, getChartTooltipStyle, getEChartBaseConfig, verticalGradient } from './echart'

describe('getChartTokens', () => {
    it('returns dark tokens by default and for unknown themes', () => {
        expect(getChartTokens().surface).toBe('#141413')
        expect(getChartTokens('system').surface).toBe('#141413')
    })

    it('returns light tokens for the light theme', () => {
        expect(getChartTokens('light')).toMatchObject({ surface: '#ffffff', textSecondary: '#5f5e57' })
    })
})

describe('verticalGradient', () => {
    it('builds a top-to-bottom linear gradient object', () => {
        const stops = [
            { offset: 0, color: '#000' },
            { offset: 1, color: '#fff' }
        ]

        expect(verticalGradient(stops)).toStrictEqual({ type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: stops })
    })
})

describe('getChartTooltipStyle', () => {
    it('uses the theme surface and text colours', () => {
        const style = getChartTooltipStyle('light')

        expect(style.backgroundColor).toBe('#ffffff')
        expect(style.textStyle.color).toBe('#141413')
    })
})

describe('getEChartBaseConfig', () => {
    it('has a transparent background so the card shows through', () => {
        expect(getEChartBaseConfig().backgroundColor).toBe('transparent')
        expect(getEChartBaseConfig('light').backgroundColor).toBe('transparent')
    })

    it('returns correct grid config', () => {
        const config = getEChartBaseConfig('dark')
        expect(config.grid).toMatchObject({
            left: 10,
            right: 10,
            top: 15,
            bottom: 25,
            containLabel: true,
            borderColor: '#2a2926'
        })
    })

    it('uses the secondary text colour for the legend', () => {
        expect((getEChartBaseConfig('dark').legend as { textStyle: { color: string } }).textStyle.color).toBe('#a3a197')
        expect((getEChartBaseConfig('light').legend as { textStyle: { color: string } }).textStyle.color).toBe(
            '#5f5e57'
        )
    })

    it('returns correct legend layout', () => {
        expect(getEChartBaseConfig('dark').legend).toMatchObject({
            type: 'plain',
            orient: 'horizontal',
            left: 5,
            bottom: 0,
            icon: 'roundRect'
        })
    })
})
