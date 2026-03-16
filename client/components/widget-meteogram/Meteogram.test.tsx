import React from 'react'

import { render } from '@testing-library/react'

import Meteogram from './Meteogram'

import '@testing-library/jest-dom'

jest.mock('echarts-for-react', () =>
    React.forwardRef((props: { option: unknown; style: unknown }, _ref) => (
        <div
            data-testid='echarts'
            data-option={JSON.stringify(props.option)}
        />
    ))
)

jest.mock('next-themes', () => ({
    useTheme: jest.fn(() => ({ theme: 'dark' }))
}))

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('@/components/weather-icon/WeatherIcon', () => ({
    getWeatherIconUrl: jest.fn(() => '/icons/clear-day.svg')
}))

jest.mock('@/tools/colors', () => ({
    colors: { red: ['#e53935', '#f25755'], blue: ['#2c7eec', '#468de8'] },
    getSensorColor: jest.fn(() => ['#e53935', '#f25755'])
}))

jest.mock('@/tools/date', () => ({
    formatDate: jest.fn(() => '01 Jan 2024'),
    formatDateFromUTC: jest.fn(() => '01 Jan')
}))

jest.mock('@/tools/weather', () => ({
    findMinValue: jest.fn(() => 0),
    findMaxValue: jest.fn(() => 30),
    getSampledData: jest.fn((data) => data)
}))

const mockData = [
    {
        date: '2024-01-01T12:00:00Z',
        temperature: 20,
        feelsLike: 18,
        windSpeed: 5,
        windDeg: 90,
        weatherId: 800,
        precipitation: 0
    },
    {
        date: '2024-01-01T15:00:00Z',
        temperature: 22,
        feelsLike: 20,
        windSpeed: 7,
        windDeg: 180,
        weatherId: 801,
        precipitation: 1
    }
]

describe('Meteogram', () => {
    it('renders with data', () => {
        const { getByTestId } = render(<Meteogram data={mockData} />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders without data', () => {
        const { getByTestId } = render(<Meteogram />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with custom height', () => {
        const { getByTestId } = render(
            <Meteogram
                data={mockData}
                height='400px'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })
})
