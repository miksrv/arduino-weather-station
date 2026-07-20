import React from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { render, screen } from '@testing-library/react'

import WidgetSensorStat from './WidgetSensorStat'

import '@testing-library/jest-dom'

dayjs.extend(utc)

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => (options ? `${key}:${JSON.stringify(options)}` : key)
    })
}))
jest.mock('next/link', () => ({ children, href, ...rest }: React.PropsWithChildren<{ href: string }>) => (
    <a
        href={href}
        {...rest}
    >
        {children}
    </a>
))
jest.mock('./StatTrendChart', () => () => <div data-testid={'chart'} />)

const history = [
    { date: '2024-01-01T00:00:00Z', temperature: 20 },
    { date: '2024-01-01T00:30:00Z', temperature: 14.7 },
    { date: '2024-01-01T01:00:00Z', temperature: 22.6 },
    { date: '2024-01-01T02:00:00Z', temperature: 21.4 }
]

const deltaHistory = [
    { date: '2024-01-01T01:00:00Z', temperature: 20 },
    { date: '2024-01-01T02:00:00Z', temperature: 21.4 }
]

describe('WidgetSensorStat', () => {
    it('renders the title', () => {
        render(
            <WidgetSensorStat
                title={'Temperature'}
                source={'temperature'}
            />
        )
        expect(screen.getByText('Temperature')).toBeInTheDocument()
    })

    it('renders the current value with unit', () => {
        render(
            <WidgetSensorStat
                source={'temperature'}
                currentValue={21.4}
                unit={'°C'}
            />
        )
        expect(screen.getByText('21.4')).toBeInTheDocument()
        expect(screen.getByText('°C')).toBeInTheDocument()
    })

    it('renders fallback "no-data" when currentValue is undefined', () => {
        render(<WidgetSensorStat source={'temperature'} />)
        expect(screen.getByText('no-data')).toBeInTheDocument()
    })

    it('renders skeleton instead of value while loading', () => {
        render(
            <WidgetSensorStat
                source={'temperature'}
                currentValue={21.4}
                loading
            />
        )
        expect(screen.queryByText('21.4')).not.toBeInTheDocument()
    })

    it('derives today min/max from history', () => {
        render(
            <WidgetSensorStat
                source={'temperature'}
                currentValue={21.4}
                history={history}
            />
        )
        expect(screen.getByText('22.6')).toBeInTheDocument()
        expect(screen.getByText('14.7')).toBeInTheDocument()
    })

    it('shows the time of the max/min readings instead of a generic "today" label', () => {
        render(
            <WidgetSensorStat
                source={'temperature'}
                currentValue={21.4}
                history={history}
            />
        )
        expect(screen.getByText('today-max-time:{"time":"06:00"}')).toBeInTheDocument()
        expect(screen.getByText('today-min-time:{"time":"05:30"}')).toBeInTheDocument()
    })

    it('renders dashes for min/max when history is empty', () => {
        render(
            <WidgetSensorStat
                source={'temperature'}
                currentValue={21.4}
                history={[]}
            />
        )
        expect(screen.getAllByText('—')).toHaveLength(2)
    })

    it('renders skeletons for min/max while chart is loading', () => {
        render(
            <WidgetSensorStat
                source={'temperature'}
                currentValue={21.4}
                history={history}
                chartLoading
            />
        )
        expect(screen.queryByText('22.6')).not.toBeInTheDocument()
        expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
    })

    it('renders an upward delta with the change-last-hour label', () => {
        render(
            <WidgetSensorStat
                source={'temperature'}
                currentValue={21.4}
                unit={'°C'}
                history={deltaHistory}
            />
        )
        expect(screen.getByText('change-last-hour')).toBeInTheDocument()
        expect(screen.getByText('+1.4°C')).toBeInTheDocument()
    })

    it('renders the trend chart when not loading', () => {
        render(
            <WidgetSensorStat
                source={'temperature'}
                history={history}
            />
        )
        expect(screen.getByTestId('chart')).toBeInTheDocument()
    })

    it('applies formatter to current value and stats', () => {
        const formatter = (v: string | number | undefined) => `${v}!`
        render(
            <WidgetSensorStat
                source={'temperature'}
                currentValue={5}
                formatter={formatter}
            />
        )
        expect(screen.getByText('5!')).toBeInTheDocument()
    })
})
