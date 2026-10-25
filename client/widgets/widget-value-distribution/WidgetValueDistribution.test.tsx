import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetValueDistribution from './WidgetValueDistribution'

import '@testing-library/jest-dom'

type Option = { xAxis: { data: string[] }; series: Array<{ data: number[] }> }

let mockOption: Option | undefined

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('next-themes', () => ({ useTheme: () => ({ theme: 'light', resolvedTheme: 'light' }) }))
jest.mock('@/components/echart', () => (props: { option: Option }) => {
    mockOption = props.option
    return <div data-testid='echarts' />
})

describe('WidgetValueDistribution', () => {
    it('shows a skeleton without bins', () => {
        render(
            <WidgetValueDistribution
                type={'temperature'}
                bins={[]}
            />
        )
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('shows each range as its share of the hours', () => {
        render(
            <WidgetValueDistribution
                type={'temperature'}
                bins={[
                    { from: 0, to: 1, count: 1 },
                    { from: 1, to: 2, count: 3 }
                ]}
            />
        )

        expect(mockOption?.xAxis.data).toStrictEqual(['0…1', '1…2'])
        expect(mockOption?.series[0].data).toStrictEqual([25, 75])
    })

    it('explains that precipitation counts wet hours only', () => {
        render(
            <WidgetValueDistribution
                type={'precipitation'}
                bins={[{ from: 0.1, to: 0.5, count: 2 }]}
            />
        )
        expect(screen.getByText('heatmap-distribution-subtitle-wet')).toBeInTheDocument()
    })
})
