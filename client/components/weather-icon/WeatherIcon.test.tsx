import React from 'react'

import { render, screen } from '@testing-library/react'

import WeatherIcon, { getWeatherIconUrl } from './WeatherIcon'

import '@testing-library/jest-dom'

// Mock next/image to render a simple img
jest.mock('next/image', () => (props: any) => <img {...props} />)

// Mock getDate to control hour
jest.mock('@/tools/date', () => ({
    getDate: (date: string) => ({
        hour: () => (date === 'night' ? 2 : 12)
    })
}))

describe('WeatherIcon', () => {
    it('renders with default size', () => {
        render(<WeatherIcon weatherId={800} />)
        const img = screen.getByAltText('')
        expect(img).toHaveAttribute('width', '24')
        expect(img).toHaveAttribute('height', '24')
    })

    it('renders with custom size', () => {
        render(
            <WeatherIcon
                weatherId={800}
                width={48}
                height={48}
            />
        )
        const img = screen.getByAltText('')
        expect(img).toHaveAttribute('width', '48')
        expect(img).toHaveAttribute('height', '48')
    })

    it('renders correct icon for day', () => {
        render(
            <WeatherIcon
                weatherId={800}
                date='day'
            />
        )
        const img = screen.getByAltText('')
        expect(img).toHaveAttribute('src', '/icons/clear-day.svg')
    })

    it('renders correct icon for night', () => {
        render(
            <WeatherIcon
                weatherId={800}
                date='night'
            />
        )
        const img = screen.getByAltText('')
        expect(img).toHaveAttribute('src', '/icons/clear-night.svg')
    })

    it('renders icon without day/night for hurricane', () => {
        render(
            <WeatherIcon
                weatherId={771}
                date='day'
            />
        )
        const img = screen.getByAltText('')
        expect(img).toHaveAttribute('src', '/icons/hurricane.svg')
    })

    it('renders icon without date', () => {
        render(<WeatherIcon weatherId={800} />)
        const img = screen.getByAltText('')
        expect(img).toHaveAttribute('src', '/icons/clear.svg')
    })

    it('renders fallback for unknown weatherId', () => {
        render(<WeatherIcon weatherId={999} />)
        const img = screen.getByAltText('')
        expect(img).toHaveAttribute('src', '/icons/undefined.svg')
    })
})

describe('getWeatherIconUrl', () => {
    it('returns day icon for day time', () => {
        expect(getWeatherIconUrl(800, 'day')).toBe('/icons/clear-day.svg')
    })

    it('returns night icon for night time', () => {
        expect(getWeatherIconUrl(800, 'night')).toBe('/icons/clear-night.svg')
    })

    it('returns icon without time for hurricane', () => {
        expect(getWeatherIconUrl(771, 'day')).toBe('/icons/hurricane.svg')
    })

    it('returns icon without date', () => {
        expect(getWeatherIconUrl(800)).toBe('/icons/clear.svg')
    })

    it('returns undefined icon for unknown weatherId', () => {
        expect(getWeatherIconUrl(999)).toBe('/icons/undefined.svg')
    })
})
