import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetDiurnalProfile from './WidgetDiurnalProfile'

import '@testing-library/jest-dom'

type Option = { series: Array<{ name: string; data: Array<number | null>; stack?: string }> }

let mockOption: Option | undefined

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('next-themes', () => ({ useTheme: () => ({ theme: 'dark', resolvedTheme: 'dark' }) }))
jest.mock('@/components/echart', () => (props: { option: Option }) => {
    mockOption = props.option
    return <div data-testid='echarts' />
})

const profile = Array.from({ length: 24 }, (_, hour) => (hour === 14 ? { hour, mean: 10, p10: 2, p90: 18 } : { hour }))

describe('WidgetDiurnalProfile', () => {
    it('shows a skeleton without any hour of data', () => {
        render(
            <WidgetDiurnalProfile
                type={'temperature'}
                profile={Array.from({ length: 24 }, (_, hour) => ({ hour }))}
            />
        )
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('stacks the 10–90 band on the 10th percentile and draws the mean on top', () => {
        render(
            <WidgetDiurnalProfile
                type={'temperature'}
                profile={profile}
            />
        )

        const [base, band, mean] = mockOption?.series ?? []
        expect(base.stack).toBe('band')
        expect(band.stack).toBe('band')
        expect(base.data[14]).toBe(2)
        expect(band.data[14]).toBe(16)
        expect(mean.data[14]).toBe(10)
        expect(mean.data[3]).toBeNull()
    })
})
