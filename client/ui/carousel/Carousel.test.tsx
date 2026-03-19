import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import { Carousel } from './Carousel'
import { NextButton, PrevButton, usePrevNextButtons } from './CarouselButtons'

import '@testing-library/jest-dom'

// ----- embla-carousel-react mock -----
// Returns a stable ref callback and a controllable API object so individual
// tests can simulate scroll state changes via the `select` event.
type MockEmblaApi = {
    scrollPrev: jest.Mock
    scrollNext: jest.Mock
    canScrollPrev: jest.Mock
    canScrollNext: jest.Mock
    on: jest.Mock
    reInit?: jest.Mock
}

let mockEmblaApi: MockEmblaApi

const makeFreshApi = (): MockEmblaApi => ({
    scrollPrev: jest.fn(),
    scrollNext: jest.fn(),
    canScrollPrev: jest.fn(() => false),
    canScrollNext: jest.fn(() => false),
    on: jest.fn()
})

jest.mock('embla-carousel-react', () => ({
    __esModule: true,
    default: () => {
        const ref = (node: HTMLElement | null) => {
            void node
        }
        return [ref, mockEmblaApi]
    }
}))

jest.mock('embla-carousel-auto-scroll', () => ({
    __esModule: true,
    default: jest.fn(() => ({}))
}))

// simple-react-ui-kit is resolved via the project-level manual mock at
// client/__mocks__/simple-react-ui-kit.js — no explicit jest.mock needed.

// ----- renderHook helper (avoids importing @testing-library/react-hooks) -----
function renderHook<T>(callback: () => T): { result: { current: T } } {
    let result: T
    const TestComponent: React.FC = () => {
        result = callback()
        return null
    }
    render(<TestComponent />)
    return {
        result: {
            get current() {
                return result
            }
        }
    }
}

// ===========================
//  Carousel (main component)
// ===========================

describe('Carousel', () => {
    beforeEach(() => {
        mockEmblaApi = makeFreshApi()
    })

    it('renders without crashing when no props are provided', () => {
        const { container } = render(<Carousel />)
        expect(container.firstChild).toBeInTheDocument()
    })

    it('renders children inside the carousel container', () => {
        render(
            <Carousel>
                <div>slide one</div>
                <div>slide two</div>
            </Carousel>
        )
        expect(screen.getByText('slide one')).toBeInTheDocument()
        expect(screen.getByText('slide two')).toBeInTheDocument()
    })

    it('renders a prev button and a next button', () => {
        render(
            <Carousel>
                <div>item</div>
            </Carousel>
        )
        const buttons = screen.getAllByRole('button')
        expect(buttons).toHaveLength(2)
    })

    it('renders correctly with no children', () => {
        const { container } = render(<Carousel />)
        // buttons container should still be present
        const buttons = container.querySelectorAll('button')
        expect(buttons).toHaveLength(2)
    })

    it('passes the autoScroll option to embla plugins when autoScroll is true', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const AutoScroll = require('embla-carousel-auto-scroll').default as jest.Mock
        AutoScroll.mockClear()
        render(
            <Carousel autoScroll={true}>
                <div>x</div>
            </Carousel>
        )
        expect(AutoScroll).toHaveBeenCalledWith({ playOnInit: true, speed: 0.5 })
    })

    it('does not call AutoScroll plugin when autoScroll is false', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const AutoScroll = require('embla-carousel-auto-scroll').default as jest.Mock
        AutoScroll.mockClear()
        render(
            <Carousel autoScroll={false}>
                <div>x</div>
            </Carousel>
        )
        expect(AutoScroll).not.toHaveBeenCalled()
    })

    it('does not call AutoScroll plugin when autoScroll is omitted', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const AutoScroll = require('embla-carousel-auto-scroll').default as jest.Mock
        AutoScroll.mockClear()
        render(
            <Carousel>
                <div>x</div>
            </Carousel>
        )
        expect(AutoScroll).not.toHaveBeenCalled()
    })

    it('prev button is disabled when emblaApi cannot scroll prev', () => {
        mockEmblaApi.canScrollPrev.mockReturnValue(false)
        render(
            <Carousel>
                <div>item</div>
            </Carousel>
        )
        const [prevBtn] = screen.getAllByRole('button')
        expect(prevBtn).toBeDisabled()
    })

    it('next button is disabled when emblaApi cannot scroll next', () => {
        mockEmblaApi.canScrollNext.mockReturnValue(false)
        render(
            <Carousel>
                <div>item</div>
            </Carousel>
        )
        const buttons = screen.getAllByRole('button')
        const nextBtn = buttons[1]
        expect(nextBtn).toBeDisabled()
    })

    it('invokes scrollPrev on the embla API when the prev button is clicked', () => {
        // Allow scrolling so the button is enabled
        mockEmblaApi.canScrollPrev.mockReturnValue(true)
        mockEmblaApi.canScrollNext.mockReturnValue(true)
        // The `on` mock must invoke the callback so state is updated
        mockEmblaApi.on.mockImplementation((_event: string, cb: (api: MockEmblaApi) => void) => {
            cb(mockEmblaApi)
        })
        render(
            <Carousel>
                <div>item</div>
            </Carousel>
        )
        const [prevBtn] = screen.getAllByRole('button')
        fireEvent.click(prevBtn)
        expect(mockEmblaApi.scrollPrev).toHaveBeenCalledTimes(1)
    })

    it('invokes scrollNext on the embla API when the next button is clicked', () => {
        mockEmblaApi.canScrollPrev.mockReturnValue(true)
        mockEmblaApi.canScrollNext.mockReturnValue(true)
        mockEmblaApi.on.mockImplementation((_event: string, cb: (api: MockEmblaApi) => void) => {
            cb(mockEmblaApi)
        })
        render(
            <Carousel>
                <div>item</div>
            </Carousel>
        )
        const buttons = screen.getAllByRole('button')
        const nextBtn = buttons[1]
        fireEvent.click(nextBtn)
        expect(mockEmblaApi.scrollNext).toHaveBeenCalledTimes(1)
    })

    it('registers reInit and select event handlers on emblaApi', () => {
        render(
            <Carousel>
                <div>item</div>
            </Carousel>
        )
        const registeredEvents = mockEmblaApi.on.mock.calls.map((c) => c[0])
        expect(registeredEvents).toContain('reInit')
        expect(registeredEvents).toContain('select')
    })

    it('renders multiple children correctly', () => {
        const items = ['alpha', 'beta', 'gamma', 'delta']
        render(
            <Carousel>
                {items.map((label) => (
                    <div key={label}>{label}</div>
                ))}
            </Carousel>
        )
        items.forEach((label) => {
            expect(screen.getByText(label)).toBeInTheDocument()
        })
    })
})

// ===========================
//  PrevButton
// ===========================

describe('PrevButton', () => {
    it('renders a button element', () => {
        render(<PrevButton />)
        expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders with type="button"', () => {
        render(<PrevButton />)
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('renders a KeyboardLeft icon', () => {
        render(<PrevButton />)
        const icon = screen.getByTestId('icon')
        expect(icon).toHaveAttribute('data-name', 'KeyboardLeft')
    })

    it('is enabled by default', () => {
        render(<PrevButton />)
        expect(screen.getByRole('button')).not.toBeDisabled()
    })

    it('is disabled when disabled prop is true', () => {
        render(<PrevButton disabled={true} />)
        expect(screen.getByRole('button')).toBeDisabled()
    })

    it('fires onClick handler when clicked', () => {
        const handleClick = jest.fn()
        render(<PrevButton onClick={handleClick} />)
        fireEvent.click(screen.getByRole('button'))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('renders children when provided', () => {
        render(<PrevButton>Go back</PrevButton>)
        expect(screen.getByText('Go back')).toBeInTheDocument()
    })
})

// ===========================
//  NextButton
// ===========================

describe('NextButton', () => {
    it('renders a button element', () => {
        render(<NextButton />)
        expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders with type="button"', () => {
        render(<NextButton />)
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('renders a KeyboardRight icon', () => {
        render(<NextButton />)
        const icon = screen.getByTestId('icon')
        expect(icon).toHaveAttribute('data-name', 'KeyboardRight')
    })

    it('is enabled by default', () => {
        render(<NextButton />)
        expect(screen.getByRole('button')).not.toBeDisabled()
    })

    it('is disabled when disabled prop is true', () => {
        render(<NextButton disabled={true} />)
        expect(screen.getByRole('button')).toBeDisabled()
    })

    it('fires onClick handler when clicked', () => {
        const handleClick = jest.fn()
        render(<NextButton onClick={handleClick} />)
        fireEvent.click(screen.getByRole('button'))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('renders children when provided', () => {
        render(<NextButton>Go forward</NextButton>)
        expect(screen.getByText('Go forward')).toBeInTheDocument()
    })
})

// ===========================
//  usePrevNextButtons hook
// ===========================

describe('usePrevNextButtons', () => {
    it('returns prevBtnDisabled=true and nextBtnDisabled=true when emblaApi is undefined', () => {
        const { result } = renderHook(() => usePrevNextButtons(undefined))
        expect(result.current.prevBtnDisabled).toBe(true)
        expect(result.current.nextBtnDisabled).toBe(true)
    })

    it('exposes onPrevButtonClick and onNextButtonClick as functions', () => {
        const { result } = renderHook(() => usePrevNextButtons(undefined))
        expect(typeof result.current.onPrevButtonClick).toBe('function')
        expect(typeof result.current.onNextButtonClick).toBe('function')
    })

    it('does not throw when onPrevButtonClick is called without an emblaApi', () => {
        const { result } = renderHook(() => usePrevNextButtons(undefined))
        expect(() => result.current.onPrevButtonClick()).not.toThrow()
    })

    it('does not throw when onNextButtonClick is called without an emblaApi', () => {
        const { result } = renderHook(() => usePrevNextButtons(undefined))
        expect(() => result.current.onNextButtonClick()).not.toThrow()
    })
})
