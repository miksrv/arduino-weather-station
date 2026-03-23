import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetMonthlyNormals from './WidgetMonthlyNormals'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('next-themes', () => ({
    useTheme: jest.fn(() => ({ theme: 'light' }))
}))

jest.mock('echarts-for-react', () => () => <div data-testid='echarts' />)

const mockNormals = Array.from({ length: 12 }, (_, i) => ({
    avgClouds: 60,
    avgPrecip: 30,
    avgTemp: -5 + i * 2,
    avgWindSpeed: 3,
    maxTemp: i * 3,
    minTemp: -15 + i,
    month: i + 1
}))

describe('WidgetMonthlyNormals', () => {
    it('shows Skeleton when loading', () => {
        render(<WidgetMonthlyNormals loading={true} />)
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
        expect(screen.queryByTestId('echarts')).not.toBeInTheDocument()
    })

    it('renders chart when not loading', () => {
        render(
            <WidgetMonthlyNormals
                normals={mockNormals}
                loading={false}
            />
        )
        expect(screen.getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders title', () => {
        render(<WidgetMonthlyNormals />)
        expect(screen.getByText('monthly-normals')).toBeInTheDocument()
    })

    it('renders without crashing with no data', () => {
        expect(() => render(<WidgetMonthlyNormals loading={false} />)).not.toThrow()
    })

    it('renders without crashing with currentYearMonthly data', () => {
        const currentYear = Array.from({ length: 12 }, (_, i) => ({ avgTemp: i * 1.5, month: i + 1 }))
        expect(() =>
            render(
                <WidgetMonthlyNormals
                    currentYearMonthly={currentYear}
                    normals={mockNormals}
                    loading={false}
                />
            )
        ).not.toThrow()
    })
})
