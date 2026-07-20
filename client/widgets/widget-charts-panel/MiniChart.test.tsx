import React from 'react'
import type { EChartsOption } from 'echarts'

import { render } from '@testing-library/react'

import MiniChart from './MiniChart'

import '@testing-library/jest-dom'

let mockCapturedOption: EChartsOption | null = null

jest.mock('echarts-for-react', () => (props: { option: EChartsOption; style: unknown }) => {
    mockCapturedOption = props.option
    return (
        <div
            data-testid='echarts'
            data-option={JSON.stringify(props.option)}
        />
    )
})

jest.mock('echarts', () => ({
    graphic: {
        LinearGradient: jest.fn((_x0, _y0, _x1, _y1, stops) => ({ stops }))
    }
}))

jest.mock('next-themes', () => ({
    useTheme: jest.fn(() => ({ theme: 'light' }))
}))

jest.mock('@/tools/colors', () => ({
    resolveCssVar: jest.fn((_variable: string, fallback: string) => fallback),
    hexToRgba: jest.fn((hex: string, alpha: number) => `rgba(${hex},${alpha})`)
}))

jest.mock('@/tools/date', () => ({
    formatDate: (_date: unknown, fmt: string) => `formatted-${fmt}`
}))

const mockData = [
    { date: '2024-01-01T00:00:00Z', temperature: 20 },
    { date: '2024-01-01T01:00:00Z', temperature: 22 }
]

describe('MiniChart', () => {
    it('renders the echarts component', () => {
        const { getByTestId } = render(
            <MiniChart
                title={'Температура (°C)'}
                data={mockData}
                source={'temperature'}
                color={'#d9614a'}
                dateFormat={'HH:mm'}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('uses the given date format for x-axis labels', () => {
        render(
            <MiniChart
                title={'Температура (°C)'}
                data={mockData}
                source={'temperature'}
                color={'#d9614a'}
                dateFormat={'DD.MM'}
            />
        )
        const xAxis = mockCapturedOption?.xAxis as { data: string[] }

        expect(xAxis.data).toStrictEqual(['formatted-DD.MM', 'formatted-DD.MM'])
    })

    it('sets the chart title', () => {
        render(
            <MiniChart
                title={'Ветер (м/с)'}
                data={mockData}
                source={'windSpeed'}
                color={'#e0a03e'}
                dateFormat={'HH:mm'}
            />
        )
        const title = mockCapturedOption?.title as { text: string }

        expect(title.text).toBe('Ветер (м/с)')
    })

    it('forces the y-axis minimum to 0 when zeroBased is set', () => {
        render(
            <MiniChart
                title={'Ветер (м/с)'}
                data={mockData}
                source={'windSpeed'}
                color={'#e0a03e'}
                dateFormat={'HH:mm'}
                zeroBased
            />
        )
        const yAxis = mockCapturedOption?.yAxis as { min?: number }

        expect(yAxis.min).toBe(0)
    })

    it('leaves the y-axis minimum unset when zeroBased is not given', () => {
        render(
            <MiniChart
                title={'Температура (°C)'}
                data={mockData}
                source={'temperature'}
                color={'#d9614a'}
                dateFormat={'HH:mm'}
            />
        )
        const yAxis = mockCapturedOption?.yAxis as { min?: number }

        expect(yAxis.min).toBeUndefined()
    })

    it('uses the series color for the line and area', () => {
        render(
            <MiniChart
                title={'Температура (°C)'}
                data={mockData}
                source={'temperature'}
                color={'#d9614a'}
                dateFormat={'HH:mm'}
            />
        )
        const series = mockCapturedOption?.series as Array<{ lineStyle: { color: string } }>

        expect(series[0].lineStyle.color).toBe('#d9614a')
    })
})
