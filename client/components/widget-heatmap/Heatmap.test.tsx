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
})
