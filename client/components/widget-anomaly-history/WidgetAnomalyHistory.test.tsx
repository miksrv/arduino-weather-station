import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetAnomalyHistory from './WidgetAnomalyHistory'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('@/tools/date', () => ({
    formatDate: (_date: string, _fmt: string) => 'formatted-date'
}))

const mockRows = [
    {
        id: '1',
        type: 'heat_wave',
        startDate: '2024-07-01',
        endDate: '2024-07-05',
        peakValue: 3.14,
        description: 'Heat wave event'
    },
    {
        id: '2',
        type: 'drought_spi30',
        startDate: '2024-06-01',
        endDate: null,
        peakValue: null,
        description: 'Ongoing drought'
    }
]

describe('WidgetAnomalyHistory', () => {
    it('renders the table', () => {
        render(<WidgetAnomalyHistory rows={mockRows} />)
        expect(screen.getByTestId('table')).toBeInTheDocument()
    })

    it('renders with empty rows', () => {
        render(<WidgetAnomalyHistory rows={[]} />)
        expect(screen.getByTestId('table')).toBeInTheDocument()
    })

    it('renders Skeleton when loading', () => {
        render(
            <WidgetAnomalyHistory
                loading={true}
                rows={[]}
            />
        )
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
        expect(screen.queryByTestId('table')).not.toBeInTheDocument()
    })

    it('renders table when loading is false', () => {
        render(
            <WidgetAnomalyHistory
                loading={false}
                rows={mockRows}
            />
        )
        expect(screen.getByTestId('table')).toBeInTheDocument()
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
    })
})
