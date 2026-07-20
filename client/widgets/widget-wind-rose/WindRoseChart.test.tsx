import React from 'react'

import { render } from '@testing-library/react'

import { WIND_ROSE_DIRECTIONS, WIND_SPEED_BINS } from './utils'
import WindRoseChart from './WindRoseChart'

import '@testing-library/jest-dom'

jest.mock('echarts-for-react', () => (props: { option: unknown; style: unknown }) => (
    <div
        data-testid='echarts'
        data-option={JSON.stringify(props.option)}
    />
))

jest.mock('@/tools/colors', () => ({
    resolveCssVar: jest.fn((_variable: string, fallback: string) => fallback),
    hexToRgba: jest.fn((hex: string, alpha: number) => `rgba(${hex},${alpha})`)
}))

const emptyBins = WIND_ROSE_DIRECTIONS.map(() => WIND_SPEED_BINS.map(() => 0))

describe('WindRoseChart', () => {
    it('renders the echarts component', () => {
        const { getByTestId } = render(<WindRoseChart directionBins={emptyBins} />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('builds one stacked bar series per speed bin, using the given direction data', () => {
        const bins = WIND_ROSE_DIRECTIONS.map((_, index) => WIND_SPEED_BINS.map((_, binIndex) => index + binIndex))
        const { getByTestId } = render(<WindRoseChart directionBins={bins} />)
        const option = JSON.parse(getByTestId('echarts').getAttribute('data-option') ?? '{}')

        expect(option.series).toHaveLength(WIND_SPEED_BINS.length)
        expect(option.series[0].data).toStrictEqual(bins.map((row) => row[0]))
        expect(option.series[0].stack).toBe('speed')
        expect(option.angleAxis.data).toStrictEqual([...WIND_ROSE_DIRECTIONS])
    })
})
