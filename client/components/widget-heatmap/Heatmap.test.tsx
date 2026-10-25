import React from 'react'

import { render } from '@testing-library/react'

import Heatmap from './Heatmap'

import '@testing-library/jest-dom'

type Option = {
    xAxis: { data: string[] }
    yAxis: { data: string[] }
    visualMap: { min: number; max: number; formatter: (value: number) => string }
    series: Array<{ data: number[][] }>
}

let mockOption: Option | undefined

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('next-themes', () => ({ useTheme: () => ({ theme: 'dark', resolvedTheme: 'dark' }) }))
jest.mock('@/components/echart', () => (props: { option: Option }) => {
    mockOption = props.option
    return <div data-testid='echarts' />
})

const points = [
    { day: '2026-10-23', hour: 0, date: '2026-10-22 19:00:00', value: -1.5 },
    { day: '2026-10-23', hour: 14, date: '2026-10-23 09:00:00', value: 6.2 },
    { day: '2026-10-24', hour: 3, date: '2026-10-23 22:00:00', value: 0.4 }
]

describe('Heatmap', () => {
    it('lays the days out as columns and the 24 hours as rows', () => {
        render(
            <Heatmap
                type={'temperature'}
                points={points}
            />
        )

        expect(mockOption?.xAxis.data).toStrictEqual(['2026-10-23', '2026-10-24'])
        expect(mockOption?.yAxis.data).toHaveLength(24)
        expect(mockOption?.series[0].data).toStrictEqual([
            [0, 0, -1.5],
            [0, 14, 6.2],
            [1, 3, 0.4]
        ])
    })

    it('scales the colours to the rounded range and labels the handles with the unit', () => {
        render(
            <Heatmap
                type={'humidity'}
                points={points}
            />
        )

        expect(mockOption?.visualMap.min).toBe(-2)
        expect(mockOption?.visualMap.max).toBe(7)
        expect(mockOption?.visualMap.formatter(55.04)).toBe('55 %')
    })
})
