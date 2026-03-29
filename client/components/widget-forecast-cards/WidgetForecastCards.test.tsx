import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetForecastCards from './WidgetForecastCards'

import '@testing-library/jest-dom'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock(
    '@/components/weather-icon',
    () =>
        ({
            weatherId,
            date,
            width,
            height
        }: {
            weatherId?: number
            date?: string
            width?: number
            height?: number
        }) => (
            <span
                data-testid='weather-icon'
                data-weather-id={weatherId}
                data-date={date}
                data-width={width}
                data-height={height}
            />
        )
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('@/components/wind-direction-icon', () => (props: any) => (
    <span
        data-testid='wind-icon'
        {...props}
    />
))

// Carousel simply renders its children so tests can assert on card content
jest.mock('@/ui/carousel', () => ({
    Carousel: ({ children }: { children: React.ReactNode }) => <div data-testid='carousel'>{children}</div>
}))

jest.mock('@/tools/helpers', () => ({
    round: (num: number, dec: number) => (dec === 0 ? Math.round(num) : Math.round(num * 10) / 10)
}))

// ---------------------------------------------------------------------------
// Date mock helpers
// ---------------------------------------------------------------------------

// Default: "now" is 2024-06-15 at hour 14; this is overridable per-test via
// mockNow / mockItemDate helpers below.
const makeDayjs = (dateStr: string, hour: number) => ({
    format: (fmt: string) => {
        if (fmt === 'YYYY-MM-DD') {
            return dateStr
        }
        if (fmt === 'dddd') {
            return `day-of-${dateStr}`
        }
        if (fmt === 'MMMM D') {
            return `month-day-of-${dateStr}`
        }
        if (fmt === 'date-only-hour') {
            return `hour-of-${dateStr}`
        }
        return dateStr
    },
    hour: () => hour
})

const TODAY_DATE = '2024-06-15'
const TODAY_HOUR = 14

// The component calls getDate(new Date().toISOString()) for "now" and
// getDate(item.date) for each forecast item. We distinguish them by checking
// whether the argument looks like an ISO timestamp produced by new Date()
// (contains 'T' and 'Z') vs a stable fixture string.
const mockGetDate = jest.fn((input: string | Date) => {
    const str = typeof input === 'string' ? input : (input as Date).toISOString()
    // When called with the live "now" timestamp the input will be the current
    // wall-clock ISO string; we can't predict it exactly, so we treat any call
    // whose value doesn't start with one of our known fixture prefixes as "now".
    if (str.startsWith('2024-06-15T14')) {
        return makeDayjs(TODAY_DATE, TODAY_HOUR)
    }
    if (str.startsWith('2024-06-15')) {
        return makeDayjs(TODAY_DATE, 10)
    }
    if (str.startsWith('2024-06-16')) {
        return makeDayjs('2024-06-16', 10)
    }
    // Fallback for "now" (live wall-clock call)
    return makeDayjs(TODAY_DATE, TODAY_HOUR)
})

jest.mock('@/tools/date', () => ({
    formatDate: (_date: unknown, fmt: string) => `formatted-${String(fmt)}`,
    getDate: (input: string | Date) => mockGetDate(input)
}))

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const dailyForecast = [
    {
        date: '2024-06-15T00:00:00Z',
        weatherId: 800,
        temperature: 22.4,
        clouds: 35,
        windSpeed: 4.8,
        windDeg: 90,
        precipitation: 1.5
    },
    {
        date: '2024-06-16T00:00:00Z',
        weatherId: 801,
        temperature: 18.0,
        clouds: 60,
        windSpeed: 3.2,
        windDeg: 180,
        precipitation: 0
    }
]

const hourlyForecast = [
    {
        date: '2024-06-15T14:00:00Z',
        weatherId: 800,
        temperature: 23.7,
        clouds: 20,
        windSpeed: 5.1,
        windDeg: 270,
        precipitation: 0.5
    },
    {
        date: '2024-06-15T15:00:00Z',
        weatherId: 803,
        temperature: 21.0,
        clouds: 45,
        windSpeed: 4.0,
        windDeg: 315
        // no precipitation field
    }
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WidgetForecastCards', () => {
    // -------------------------------------------------------------------------
    // Loading state
    // -------------------------------------------------------------------------
    describe('loading state', () => {
        it('renders exactly 6 skeleton items when loading is true', () => {
            render(<WidgetForecastCards loading={true} />)
            expect(screen.getAllByTestId('skeleton')).toHaveLength(6)
        })

        it('renders skeletons alongside cards when loading is true and forecast is provided', () => {
            // The component shows skeletons AND the forecast section independently —
            // the loading guard only controls the skeleton row, not the cards.
            render(
                <WidgetForecastCards
                    loading={true}
                    forecast={dailyForecast}
                />
            )
            expect(screen.getAllByTestId('skeleton')).toHaveLength(6)
            expect(screen.getByTestId('carousel')).toBeInTheDocument()
        })

        it('renders no skeletons when not loading', () => {
            render(
                <WidgetForecastCards
                    loading={false}
                    forecast={dailyForecast}
                />
            )
            expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
        })
    })

    // -------------------------------------------------------------------------
    // Empty / undefined data
    // -------------------------------------------------------------------------
    describe('empty / undefined forecast', () => {
        it('renders without crashing when forecast is undefined', () => {
            const { container } = render(<WidgetForecastCards />)
            expect(container.firstChild).toBeInTheDocument()
        })

        it('renders without crashing when forecast is an empty array', () => {
            const { container } = render(<WidgetForecastCards forecast={[]} />)
            expect(container.firstChild).toBeInTheDocument()
        })

        it('does not render the carousel when forecast is empty', () => {
            render(<WidgetForecastCards forecast={[]} />)
            expect(screen.queryByTestId('carousel')).not.toBeInTheDocument()
        })

        it('renders the correct number of cards matching the forecast length', () => {
            render(<WidgetForecastCards forecast={dailyForecast} />)
            expect(screen.getAllByTestId('weather-icon')).toHaveLength(dailyForecast.length)
        })
    })

    // -------------------------------------------------------------------------
    // Daily mode (isHourly=false / undefined)
    // -------------------------------------------------------------------------
    describe('daily mode', () => {
        it('renders day name via formatDate for each card', () => {
            render(<WidgetForecastCards forecast={dailyForecast} />)
            expect(screen.getAllByText('formatted-dddd')).toHaveLength(dailyForecast.length)
        })

        it('renders date label (MMMM D) via formatDate for each card', () => {
            render(<WidgetForecastCards forecast={dailyForecast} />)
            expect(screen.getAllByText('formatted-MMMM D')).toHaveLength(dailyForecast.length)
        })

        it('does not render time label (cardTime) in daily mode', () => {
            render(<WidgetForecastCards forecast={dailyForecast} />)
            // time label uses the i18n key 'date-only-hour' as format
            expect(screen.queryByText('formatted-date-only-hour')).not.toBeInTheDocument()
        })

        it('renders a weather icon for every card', () => {
            render(<WidgetForecastCards forecast={dailyForecast} />)
            expect(screen.getAllByTestId('weather-icon')).toHaveLength(dailyForecast.length)
        })

        it('renders rounded temperature for each card', () => {
            render(<WidgetForecastCards forecast={dailyForecast} />)
            // 22.4 rounds to 22, 18.0 rounds to 18
            expect(screen.getByText('22°')).toBeInTheDocument()
            expect(screen.getByText('18°')).toBeInTheDocument()
        })

        it('renders cloud percentage when clouds is defined', () => {
            render(<WidgetForecastCards forecast={dailyForecast} />)
            expect(screen.getByText('35%')).toBeInTheDocument()
            expect(screen.getByText('60%')).toBeInTheDocument()
        })

        it('does not render cloud percentage when clouds is undefined', () => {
            const forecast = [{ date: '2024-06-16T00:00:00Z', weatherId: 800, temperature: 20 }]
            render(<WidgetForecastCards forecast={forecast} />)
            // No "%" text should appear since clouds is not set
            expect(screen.queryByText(/%/)).not.toBeInTheDocument()
        })

        it('renders wind speed and wind icon when windSpeed is defined', () => {
            render(<WidgetForecastCards forecast={dailyForecast} />)
            expect(screen.getAllByTestId('wind-icon')).toHaveLength(dailyForecast.length)
            // round(4.8, 1) = 4.8; i18n key "meters-per-second" becomes the key itself
            expect(screen.getByText(/4\.8/)).toBeInTheDocument()
        })

        it('does not render wind icon when windSpeed is undefined', () => {
            const forecast = [{ date: '2024-06-16T00:00:00Z', weatherId: 800, temperature: 20 }]
            render(<WidgetForecastCards forecast={forecast} />)
            expect(screen.queryByTestId('wind-icon')).not.toBeInTheDocument()
        })

        it('renders precipitation with millimeters label when precipitation > 0', () => {
            render(<WidgetForecastCards forecast={dailyForecast} />)
            // First item has precipitation 1.5; i18n key "millimeters" returns "millimeters"
            expect(screen.getByText(/1\.5/)).toBeInTheDocument()
            expect(screen.getByText(/millimeters/)).toBeInTheDocument()
        })

        it('does not render precipitation row when precipitation is 0', () => {
            // Second item in dailyForecast has precipitation: 0
            render(<WidgetForecastCards forecast={[dailyForecast[1]]} />)
            expect(screen.queryByText(/millimeters/)).not.toBeInTheDocument()
        })

        it('does not render precipitation row when precipitation is undefined', () => {
            const forecast = [{ date: '2024-06-16T00:00:00Z', weatherId: 800, temperature: 20 }]
            render(<WidgetForecastCards forecast={forecast} />)
            expect(screen.queryByText(/millimeters/)).not.toBeInTheDocument()
        })
    })

    // -------------------------------------------------------------------------
    // Hourly mode
    // -------------------------------------------------------------------------
    describe('hourly mode (isHourly=true)', () => {
        it('renders time label via formatDate for each card', () => {
            render(
                <WidgetForecastCards
                    isHourly={true}
                    forecast={hourlyForecast}
                />
            )
            // formatDate is mocked to return `formatted-${fmt}`; the format arg is the
            // i18n key 'date-only-hour' which the t() mock returns as-is
            expect(screen.getAllByText('formatted-date-only-hour')).toHaveLength(hourlyForecast.length)
        })

        it('does not render day name or date label in hourly mode', () => {
            render(
                <WidgetForecastCards
                    isHourly={true}
                    forecast={hourlyForecast}
                />
            )
            expect(screen.queryByText('formatted-dddd')).not.toBeInTheDocument()
            expect(screen.queryByText('formatted-MMMM D')).not.toBeInTheDocument()
        })

        it('renders a weather icon for every hourly card', () => {
            render(
                <WidgetForecastCards
                    isHourly={true}
                    forecast={hourlyForecast}
                />
            )
            expect(screen.getAllByTestId('weather-icon')).toHaveLength(hourlyForecast.length)
        })

        it('renders rounded temperature for each hourly card', () => {
            render(
                <WidgetForecastCards
                    isHourly={true}
                    forecast={hourlyForecast}
                />
            )
            // 23.7 rounds to 24; 21.0 stays 21
            expect(screen.getByText('24°')).toBeInTheDocument()
            expect(screen.getByText('21°')).toBeInTheDocument()
        })

        it('renders clouds when defined', () => {
            render(
                <WidgetForecastCards
                    isHourly={true}
                    forecast={hourlyForecast}
                />
            )
            expect(screen.getByText('20%')).toBeInTheDocument()
            expect(screen.getByText('45%')).toBeInTheDocument()
        })

        it('renders wind icon when windSpeed is defined', () => {
            render(
                <WidgetForecastCards
                    isHourly={true}
                    forecast={hourlyForecast}
                />
            )
            expect(screen.getAllByTestId('wind-icon')).toHaveLength(hourlyForecast.length)
        })

        it('renders precipitation when precipitation > 0', () => {
            render(
                <WidgetForecastCards
                    isHourly={true}
                    forecast={hourlyForecast}
                />
            )
            // First hourly item has precipitation: 0.5
            expect(screen.getByText(/0\.5/)).toBeInTheDocument()
        })

        it('does not render precipitation row when precipitation is undefined', () => {
            // Second hourly item has no precipitation field
            render(
                <WidgetForecastCards
                    isHourly={true}
                    forecast={[hourlyForecast[1]]}
                />
            )
            expect(screen.queryByText(/millimeters/)).not.toBeInTheDocument()
        })
    })

    // -------------------------------------------------------------------------
    // Highlighted (today / current-hour) class
    // -------------------------------------------------------------------------
    describe('highlighted class', () => {
        it('applies highlighted class to a daily card whose date matches today', () => {
            // dailyForecast[0] date starts with '2024-06-15' — mock returns TODAY_DATE
            // dailyForecast[1] date starts with '2024-06-16' — mock returns '2024-06-16'
            const { container } = render(<WidgetForecastCards forecast={dailyForecast} />)
            const cards = container.querySelectorAll('[class*="card"]')
            // The highlighted card should contain the class token 'highlighted'
            const highlightedCards = Array.from(cards).filter((c) => c.className.includes('highlighted'))
            expect(highlightedCards).toHaveLength(1)
        })

        it('does not apply highlighted class to a daily card whose date differs from today', () => {
            const { container } = render(<WidgetForecastCards forecast={[dailyForecast[1]]} />)
            const cards = container.querySelectorAll('[class*="card"]')
            const highlightedCards = Array.from(cards).filter((c) => c.className.includes('highlighted'))
            expect(highlightedCards).toHaveLength(0)
        })

        it('applies highlighted class to an hourly card whose date matches today', () => {
            // The component highlights any card whose date string matches today —
            // this applies in both daily and hourly modes.
            // hourlyForecast[0] has date '2024-06-15T14...' which maps to TODAY_DATE.
            const { container } = render(
                <WidgetForecastCards
                    isHourly={true}
                    forecast={[hourlyForecast[0]]}
                />
            )
            const cards = container.querySelectorAll('[class*="card"]')
            const highlightedCards = Array.from(cards).filter((c) => c.className.includes('highlighted'))
            expect(highlightedCards).toHaveLength(1)
        })

        it('does not apply highlighted class to an hourly card on a different date', () => {
            // Use a forecast item whose date falls on a different day so it is not highlighted
            const futureForecast = [
                {
                    date: '2024-06-16T14:00:00Z',
                    weatherId: 800,
                    temperature: 20,
                    clouds: 30,
                    windSpeed: 3.0,
                    windDeg: 90
                }
            ]
            const { container } = render(
                <WidgetForecastCards
                    isHourly={true}
                    forecast={futureForecast}
                />
            )
            const cards = container.querySelectorAll('[class*="card"]')
            const highlightedCards = Array.from(cards).filter((c) => c.className.includes('highlighted'))
            expect(highlightedCards).toHaveLength(0)
        })
    })

    // -------------------------------------------------------------------------
    // Carousel rendering
    // -------------------------------------------------------------------------
    describe('carousel', () => {
        it('renders the carousel when forecast is non-empty', () => {
            render(<WidgetForecastCards forecast={dailyForecast} />)
            expect(screen.getByTestId('carousel')).toBeInTheDocument()
        })

        it('does not render the carousel when forecast is undefined', () => {
            render(<WidgetForecastCards />)
            expect(screen.queryByTestId('carousel')).not.toBeInTheDocument()
        })

        it('renders the carousel even when loading is true but forecast is non-empty', () => {
            // Both the skeleton row and the forecast carousel render independently
            render(
                <WidgetForecastCards
                    loading={true}
                    forecast={dailyForecast}
                />
            )
            expect(screen.getByTestId('carousel')).toBeInTheDocument()
        })
    })

    // -------------------------------------------------------------------------
    // Default temperature fallback (undefined temperature)
    // -------------------------------------------------------------------------
    describe('temperature fallback', () => {
        it('renders 0° when temperature is undefined', () => {
            const forecast = [{ date: '2024-06-15T00:00:00Z', weatherId: 800 }]
            render(<WidgetForecastCards forecast={forecast} />)
            expect(screen.getByText('0°')).toBeInTheDocument()
        })
    })

    // -------------------------------------------------------------------------
    // Default weatherId fallback (undefined weatherId)
    // -------------------------------------------------------------------------
    describe('weatherId fallback', () => {
        it('renders weather icon even when weatherId is undefined (defaults to 800)', () => {
            const forecast = [{ date: '2024-06-15T00:00:00Z', temperature: 20 }]
            render(<WidgetForecastCards forecast={forecast} />)
            expect(screen.getByTestId('weather-icon')).toBeInTheDocument()
        })
    })
})
