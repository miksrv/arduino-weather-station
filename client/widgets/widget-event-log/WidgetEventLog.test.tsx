import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetEventLog from './WidgetEventLog'

import '@testing-library/jest-dom'

jest.mock('@/pages/_app', () => ({
    POLING_INTERVAL_CURRENT: 600000
}))

jest.mock('@/api', () => ({
    API: {
        useGetEventsQuery: jest.fn()
    }
}))

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const dictionary: Record<string, string> = {
                'event-log': 'Журнал событий',
                'event-log-empty': 'Нет недавних событий'
            }

            return dictionary[key] ?? key
        }
    })
}))

jest.mock('./EventLogItem', () => (props: { event: { date: string } }) => (
    <div data-testid={'event-item'}>{props.event.date}</div>
))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const useGetEventsQuery = require('@/api').API.useGetEventsQuery

describe('WidgetEventLog', () => {
    it('renders the title', () => {
        useGetEventsQuery.mockReturnValue({ data: { events: [] }, isLoading: false })
        render(<WidgetEventLog />)
        expect(screen.getByText('Журнал событий')).toBeInTheDocument()
    })

    it('renders one item per event', () => {
        useGetEventsQuery.mockReturnValue({
            data: {
                events: [
                    { date: '2024-01-01T15:42:00Z', type: 'temperature_change', direction: 'up', value: 0.6 },
                    { date: '2024-01-01T15:41:00Z', type: 'system_status', status: 'ok' }
                ]
            },
            isLoading: false
        })
        render(<WidgetEventLog />)
        expect(screen.getAllByTestId('event-item')).toHaveLength(2)
    })

    it('renders the empty state when there are no events', () => {
        useGetEventsQuery.mockReturnValue({ data: { events: [] }, isLoading: false })
        render(<WidgetEventLog />)
        expect(screen.getByText('Нет недавних событий')).toBeInTheDocument()
    })

    it('renders a skeleton instead of the list while loading', () => {
        useGetEventsQuery.mockReturnValue({ data: undefined, isLoading: true })
        render(<WidgetEventLog />)
        expect(screen.queryByTestId('event-item')).not.toBeInTheDocument()
        expect(screen.queryByText('Нет недавних событий')).not.toBeInTheDocument()
    })
})
