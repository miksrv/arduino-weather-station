import { renderHook } from '@testing-library/react'

import useServiceWorker from './useServiceWorker'

jest.mock('@/api/api', () => ({ urlAPI: 'http://localhost:8080/' }))

describe('useServiceWorker', () => {
    const register = jest.fn()

    beforeEach(() => {
        register.mockReset().mockResolvedValue({})
        Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { register } })
    })

    afterEach(() => {
        Reflect.deleteProperty(navigator, 'serviceWorker')
    })

    it('registers the worker with the API origin when enabled', () => {
        renderHook(() => useServiceWorker(true))

        expect(register).toHaveBeenCalledTimes(1)
        expect(register).toHaveBeenCalledWith(`/sw.js?api=${encodeURIComponent('http://localhost:8080')}`)
    })

    it('does nothing when disabled', () => {
        renderHook(() => useServiceWorker(false))

        expect(register).not.toHaveBeenCalled()
    })

    it('waits for the load event while the page is still loading', () => {
        jest.spyOn(document, 'readyState', 'get').mockReturnValue('loading')

        renderHook(() => useServiceWorker(true))
        expect(register).not.toHaveBeenCalled()

        window.dispatchEvent(new Event('load'))
        expect(register).toHaveBeenCalledTimes(1)

        jest.restoreAllMocks()
    })

    it('does nothing when the browser has no service workers', () => {
        Reflect.deleteProperty(navigator, 'serviceWorker')

        expect(() => renderHook(() => useServiceWorker(true))).not.toThrow()
    })

    it('reports a failed registration', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
        register.mockRejectedValue(new Error('blocked'))

        renderHook(() => useServiceWorker(true))
        await Promise.resolve()
        await Promise.resolve()

        expect(consoleError).toHaveBeenCalledWith('Service worker registration failed', expect.any(Error))
        consoleError.mockRestore()
    })
})
