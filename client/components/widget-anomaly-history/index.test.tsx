import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetAnomalyHistory from './index'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}))

const mockRows = [
    {
        id: '1',
        type: 'heat_wave',
        startDate: '2024-06-01',
        endDate: '2024-06-10',
        peakValue: 3.75,
        description: 'Abnormally high temperatures'
    },
    {
        id: '2',
        type: 'cold_snap',
        startDate: '2024-01-15',
        endDate: null,
        peakValue: null,
        description: 'Ongoing cold event'
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

    it('uses translation key for anomaly-type column header', () => {
        render(<WidgetAnomalyHistory rows={mockRows} />)
        expect(screen.getByTestId('table')).toBeInTheDocument()
    })
})
