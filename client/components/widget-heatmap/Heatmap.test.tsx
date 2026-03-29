import React from 'react'

import { render } from '@testing-library/react'

import Heatmap from './Heatmap'

import '@testing-library/jest-dom'

jest.mock('echarts-for-react', () => (props: { option: unknown; style: unknown }) => (
    <div
        data-testid='echarts'
        data-option={JSON.stringify(props.option)}
    />
))

jest.mock('dayjs', () => {
    const actual = jest.requireActual('dayjs')
    return actual
})

jest.mock('next-themes', () => ({
    useTheme: jest.fn(() => ({ theme: 'dark' }))
}))

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('@/tools/hooks/useClientOnly', () => jest.fn(() => false))

jest.mock('@/tools/date', () => ({
    formatDate: jest.fn(() => '01.01.2024')
}))

const mockData = [
    { date: '2024-01-01T12:00:00Z', temperature: 20, pressure: 1013, humidity: 60 },
    { date: '2024-01-02T10:00:00Z', temperature: 22, pressure: 1010, humidity: 55 }
]

describe('Heatmap', () => {
    it('renders for temperature type', () => {
        const { getByTestId } = render(
            <Heatmap
                type='temperature'
                data={mockData}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders for humidity type', () => {
        const { getByTestId } = render(
            <Heatmap
                type='humidity'
                data={mockData}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders for pressure type', () => {
        const { getByTestId } = render(
            <Heatmap
                type='pressure'
                data={mockData}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders for clouds type', () => {
        const mockDataWithClouds = [
            { date: '2024-01-01T12:00:00Z', clouds: 80 },
            { date: '2024-01-02T10:00:00Z', clouds: 40 }
        ]
        const { getByTestId } = render(
            <Heatmap
                type='clouds'
                data={mockDataWithClouds}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders for precipitation type', () => {
        const mockDataWithPrecip = [
            { date: '2024-01-01T12:00:00Z', precipitation: 5 },
            { date: '2024-01-02T10:00:00Z', precipitation: 0 }
        ]
        const { getByTestId } = render(
            <Heatmap
                type='precipitation'
                data={mockDataWithPrecip}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders without data', () => {
        const { getByTestId } = render(<Heatmap type='temperature' />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with title and subTitle', () => {
        const { getByTestId } = render(
            <Heatmap
                type='temperature'
                data={mockData}
                title='Temperature Heatmap'
                subTitle='2024'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with custom height', () => {
        const { getByTestId } = render(
            <Heatmap
                type='pressure'
                height='500px'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders in client-only mode (isClient=true)', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const useClientOnly = require('@/tools/hooks/useClientOnly') as jest.Mock
        useClientOnly.mockReturnValue(true)
        const { getByTestId } = render(
            <Heatmap
                type='temperature'
                data={mockData}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
        useClientOnly.mockReturnValue(false)
    })

    it('renders with data spanning multiple days', () => {
        const multiDayData = Array.from({ length: 48 }, (_, i) => ({
            date: `2024-01-${String(Math.floor(i / 24) + 1).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:00:00Z`,
            temperature: 10 + i * 0.5
        }))
        const { getByTestId } = render(
            <Heatmap
                type='temperature'
                data={multiDayData}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })
})
