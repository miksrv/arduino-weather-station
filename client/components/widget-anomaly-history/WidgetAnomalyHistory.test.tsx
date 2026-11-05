import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetAnomalyHistory from './WidgetAnomalyHistory'

import '@testing-library/jest-dom'

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => (options ? `${key}:${JSON.stringify(options)}` : key)
    })
}))

jest.mock('@/tools/date', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dayjs = require('dayjs')

    return { getCurrentDate: () => dayjs('2026-11-05') }
})

jest.mock('simple-react-ui-kit', () => ({
    Skeleton: () => <div data-testid={'skeleton'} />,
    Table: ({
        data,
        columns,
        noDataCaption
    }: {
        data: Array<Record<string, unknown>>
        columns: Array<{
            accessor: string
            formatter: (value: unknown, rows: unknown[], index: number) => React.ReactNode
        }>
        noDataCaption: string
    }) =>
        data.length ? (
            <table data-testid={'table'}>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={String(row.id)}>
                            {columns.map((column, c) => (
                                <td key={c}>{column.formatter(row[column.accessor], data, index)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            <p>{noDataCaption}</p>
        )
}))

const rows = [
    {
        id: '1',
        type: 'fog_risk',
        startDate: '2026-10-28',
        endDate: '2026-10-29',
        peakValue: 1.8,
        description: ''
    },
    {
        id: '2',
        type: 'heat_wave',
        startDate: '2026-11-03',
        endDate: null,
        peakValue: 2.34,
        description: ''
    },
    {
        id: '3',
        type: 'cold_snap',
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        peakValue: -2,
        description: ''
    }
]

describe('WidgetAnomalyHistory', () => {
    it('shows only the last month, the ongoing episode first', () => {
        render(<WidgetAnomalyHistory rows={rows} />)
        const tableRows = screen.getAllByRole('row')

        expect(tableRows).toHaveLength(2)
        expect(tableRows[0]).toHaveTextContent('anomaly-heat-wave')
        expect(tableRows[1]).toHaveTextContent('anomaly-fog-risk')
        expect(screen.queryByText('anomaly-cold-snap')).not.toBeInTheDocument()
    })

    it('writes the duration in days and the measure with its meaning', () => {
        render(<WidgetAnomalyHistory rows={rows} />)
        const [ongoing, fog] = screen.getAllByRole('row')

        expect(ongoing).toHaveTextContent('days-count:{"count":3}')
        expect(ongoing).toHaveTextContent('anomaly-metric-zscore:{"value":"+2.3"}')
        expect(ongoing).toHaveTextContent('anomaly-period-ongoing')
        expect(fog).toHaveTextContent('days-count:{"count":2}')
        expect(fog).toHaveTextContent('anomaly-metric-dew-spread:{"value":"1.8"}')
    })

    it('says so when the month was quiet', () => {
        render(<WidgetAnomalyHistory rows={[rows[2]]} />)
        expect(screen.getByText('anomaly-history-empty')).toBeInTheDocument()
    })

    it('shows a skeleton while loading', () => {
        render(
            <WidgetAnomalyHistory
                loading={true}
                rows={[]}
            />
        )
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
        expect(screen.queryByTestId('table')).not.toBeInTheDocument()
    })
})
