import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import WidgetForecastHourly from './WidgetForecastHourly'

import '@testing-library/jest-dom'

type Option = {
    series: Array<{ name: string; type: string; data: unknown[] }>
    yAxis: Array<{ axisLabel: { formatter: string } }>
}

let mockOption: Option | undefined

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('next-themes', () => ({ useTheme: () => ({ theme: 'dark', resolvedTheme: 'dark' }) }))
// eslint-disable-next-line next/no-img-element
jest.mock('next/image', () => (props: { alt: string }) => <img alt={props.alt} />)
jest.mock('@/components/echart', () => (props: { option: Option }) => {
    mockOption = props.option
    return <div data-testid='echarts' />
})

// 19:00 and 20:00 UTC are 00:00 and 01:00 at the station (UTC+5)
const hours = [
    {
        date: '2026-10-24 18:00:00',
        temperature: 2.4,
        feelsLike: -1,
        precipitation: 0,
        clouds: 90,
        windSpeed: 3,
        windGust: 6,
        windDeg: 0,
        weatherId: 804
    },
    {
        date: '2026-10-24 19:00:00',
        temperature: 1.6,
        feelsLike: -2,
        precipitation: 0.6,
        clouds: 100,
        windSpeed: 4,
        windGust: 8,
        windDeg: 90,
        weatherId: 500
    },
    {
        date: '2026-10-24 20:00:00',
        temperature: 0.4,
        feelsLike: -3,
        precipitation: 0.04,
        clouds: 70,
        windSpeed: 5.4,
        windGust: 9,
        windDeg: 180,
        weatherId: 803
    }
]

describe('WidgetForecastHourly', () => {
    beforeEach(() => {
        mockOption = undefined
    })

    it('shows a skeleton while loading or without hours', () => {
        const { rerender } = render(<WidgetForecastHourly loading={true} />)
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()

        rerender(<WidgetForecastHourly hours={[]} />)
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('draws the temperature with feels-like first', () => {
        render(<WidgetForecastHourly hours={hours} />)

        expect(mockOption?.series.map((series) => series.name)).toStrictEqual(['temperature', 'feels-like'])
        expect(mockOption?.series[0].data).toStrictEqual([2.4, 1.6, 0.4])
        expect(screen.getByRole('button', { name: 'forecast-mode-temperature' })).toHaveAttribute(
            'aria-pressed',
            'true'
        )
    })

    it('switches to precipitation bars with clouds on a second axis', () => {
        render(<WidgetForecastHourly hours={hours} />)
        fireEvent.click(screen.getByRole('button', { name: 'forecast-mode-precipitation' }))

        expect(mockOption?.series[0]).toMatchObject({ type: 'bar', data: [0, 0.6, 0.04] })
        expect(mockOption?.yAxis.map((axis) => axis.axisLabel.formatter)).toStrictEqual([
            '{value} millimeters',
            '{value}%'
        ])
    })

    it('switches to wind speed and gusts', () => {
        render(<WidgetForecastHourly hours={hours} />)
        fireEvent.click(screen.getByRole('button', { name: 'forecast-mode-wind' }))

        expect(mockOption?.series.map((series) => series.name)).toStrictEqual(['wind-speed', 'wind-gust'])
    })

    it('lists every hour: now first, the weekday at midnight, precipitation from 0.1 mm', () => {
        render(<WidgetForecastHourly hours={hours} />)

        const cells = screen.getAllByRole('listitem')
        expect(cells).toHaveLength(3)
        expect(cells[0]).toHaveTextContent('forecast-now')
        expect(cells[1]).toHaveAttribute('data-new-day', 'true')
        expect(cells[1]).toHaveTextContent('0.6 millimeters')
        expect(cells[2]).not.toHaveTextContent('millimeters')
        expect(cells[0]).toHaveTextContent('+2°')
    })
})
