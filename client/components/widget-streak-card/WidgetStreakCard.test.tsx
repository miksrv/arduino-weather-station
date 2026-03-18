import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetStreakCard from './WidgetStreakCard'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key)
    })
}))

jest.mock('@/tools/date', () => ({
    formatDate: (_d: string, _f: string) => _d
}))

jest.mock('simple-react-ui-kit', () => ({
    Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
    Skeleton: () => <div data-testid='skeleton' />
}))

describe('WidgetStreakCard', () => {
    it('renders skeleton when loading', () => {
        render(
            <WidgetStreakCard
                loading={true}
                type='wet'
                days={5}
                start='2024-01-01'
                end='2024-01-05'
            />
        )
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
        expect(screen.queryByText('longest-wet-streak')).not.toBeInTheDocument()
    })

    it('renders correct title and icon for type=wet', () => {
        render(
            <WidgetStreakCard
                type='wet'
                days={7}
                start='2024-02-01'
                end='2024-02-07'
            />
        )
        expect(screen.getByText('longest-wet-streak')).toBeInTheDocument()
        expect(screen.getByTestId('icon-WaterDrop')).toBeInTheDocument()
    })

    it('renders correct title and icon for type=dry', () => {
        render(
            <WidgetStreakCard
                type='dry'
                days={10}
                start='2024-03-01'
                end='2024-03-10'
            />
        )
        expect(screen.getByText('longest-dry-streak')).toBeInTheDocument()
        expect(screen.getByTestId('icon-Sun')).toBeInTheDocument()
    })

    it('renders days count via days-count key with opts', () => {
        render(
            <WidgetStreakCard
                type='wet'
                days={14}
                start='2024-04-01'
                end='2024-04-14'
            />
        )
        expect(screen.getByText('days-count:{"count":14}')).toBeInTheDocument()
    })

    it('renders start and end date strings in the range', () => {
        render(
            <WidgetStreakCard
                type='dry'
                days={3}
                start='2024-05-01'
                end='2024-05-03'
            />
        )
        expect(screen.getByText(/2024-05-01/)).toBeInTheDocument()
        expect(screen.getByText(/2024-05-03/)).toBeInTheDocument()
    })

    it('renders without crashing when days=0 and start/end are empty strings', () => {
        expect(() =>
            render(
                <WidgetStreakCard
                    type='wet'
                    days={0}
                    start=''
                    end=''
                />
            )
        ).not.toThrow()
    })
})
