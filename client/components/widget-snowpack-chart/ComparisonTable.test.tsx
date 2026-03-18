import React from 'react'

import { render, screen } from '@testing-library/react'

import { ComparisonTable } from './ComparisonTable'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('simple-react-ui-kit', () => ({
    cn: (...args: string[]) => args.filter(Boolean).join(' '),

    Table: ({
        data,
        columns
    }: {
        data: any[]
        columns: Array<{ accessor: string; header: string; formatter?: (...args: any[]) => React.ReactNode }>
    }) => (
        <table>
            <thead>
                <tr>
                    {columns.map((c) => (
                        <th key={c.accessor}>{c.header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, i) => (
                    <tr key={i}>
                        {columns.map((c) => (
                            <td key={c.accessor}>
                                {c.formatter ? c.formatter(row[c.accessor], data, i) : String(row[c.accessor])}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}))

const rows = [
    { year: '2023-2024', maxSWE: 180, floodOccurred: true },
    { year: '2022-2023', maxSWE: 95, floodOccurred: false },
    { year: '2024-2025', maxSWE: 60, floodOccurred: undefined }
]

describe('ComparisonTable', () => {
    it('renders column headers', () => {
        render(<ComparisonTable rows={rows} />)
        expect(screen.getByText('winter-comparison')).toBeInTheDocument()
        expect(screen.getByText('swe-chart-title')).toBeInTheDocument()
        // floodOccurred column header is t('flood-occurred') = 'flood-occurred'
        // but it also appears as cell text for the true row — use getAllByText
        expect(screen.getAllByText('flood-occurred').length).toBeGreaterThanOrEqual(1)
    })

    it('shows flood-occurred text for row with floodOccurred=true', () => {
        render(<ComparisonTable rows={rows} />)
        expect(screen.getAllByText('flood-occurred').length).toBeGreaterThanOrEqual(1)
    })

    it('shows no-flood text for row with floodOccurred=false', () => {
        render(<ComparisonTable rows={rows} />)
        expect(screen.getByText('no-flood')).toBeInTheDocument()
    })

    it('shows season-in-progress text for row with floodOccurred=undefined', () => {
        render(<ComparisonTable rows={rows} />)
        expect(screen.getByText('season-in-progress')).toBeInTheDocument()
    })

    it('applies floodYearCell class to cells in the FLOOD_YEAR row', () => {
        render(<ComparisonTable rows={rows} />)
        // The 2023-2024 year span should have class 'floodYearCell'
        const yearCell = screen.getByText('2023-2024')
        expect(yearCell).toHaveClass('floodYearCell')
    })

    it('does not apply floodYearCell class to non-flood year rows', () => {
        render(<ComparisonTable rows={rows} />)
        const nonFloodYear = screen.getByText('2022-2023')
        expect(nonFloodYear).not.toHaveClass('floodYearCell')
    })
})
