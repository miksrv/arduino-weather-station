import { act, renderHook } from '@testing-library/react'

import { DEFAULT_STORAGE_KEY, useLocalStorage } from './useLocalStorage'

const storageKey = 'testKey'

beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
})

describe('useLocalStorage', () => {
    it('returns initialState when localStorage is empty', () => {
        const { result } = renderHook(() => useLocalStorage(storageKey, 'initial'))
        expect(result.current[0]).toBe('initial')
    })

    it('returns initialState from a factory function when localStorage is empty', () => {
        const { result } = renderHook(() => useLocalStorage(storageKey, () => 'factory'))
        expect(result.current[0]).toBe('factory')
    })

    it('reads existing value from localStorage', () => {
        localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ [storageKey]: 'stored' }))
        const { result } = renderHook(() => useLocalStorage<string, string>(storageKey, 'initial'))
        expect(result.current[0]).toBe('stored')
    })

    it('updates state and writes to localStorage via setState', async () => {
        const { result } = renderHook(() => useLocalStorage<string, string>(storageKey, 'initial'))

        await act(async () => {
            result.current[1]('updated')
        })

        expect(result.current[0]).toBe('updated')
        const stored = JSON.parse(localStorage.getItem(DEFAULT_STORAGE_KEY) ?? '{}')
        expect(stored[storageKey]).toBe('updated')
    })

    it('removes key from localStorage and resets state to initialState via remove', async () => {
        localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ [storageKey]: 'stored' }))
        const { result } = renderHook(() => useLocalStorage<string, string>(storageKey, 'initial'))

        await act(async () => {
            result.current[2]()
        })

        expect(result.current[0]).toBe('initial')
    })

    it('handles invalid JSON in localStorage gracefully', () => {
        localStorage.setItem(DEFAULT_STORAGE_KEY, 'not-json')
        const { result } = renderHook(() => useLocalStorage<string, string>(storageKey, 'fallback'))
        expect(result.current[0]).toBe('fallback')
    })

    it('returns undefined state when no initialState is provided', () => {
        const { result } = renderHook(() => useLocalStorage<string, string>(storageKey))
        expect(result.current[0]).toBeUndefined()
    })

    it('returns tuple with [state, setState, remove]', () => {
        const { result } = renderHook(() => useLocalStorage(storageKey, 42))
        const [state, setState, remove] = result.current
        expect(typeof state).toBe('number')
        expect(typeof setState).toBe('function')
        expect(typeof remove).toBe('function')
    })

    it('writes to localStorage synchronously within the same setState call', () => {
        const { result } = renderHook(() => useLocalStorage<string, string>(storageKey, 'initial'))

        act(() => {
            result.current[1]('sync-value')
            // localStorage must already contain the new value before act flushes effects
            const stored = JSON.parse(localStorage.getItem(DEFAULT_STORAGE_KEY) ?? '{}')
            expect(stored[storageKey]).toBe('sync-value')
        })
    })

    it('accepts a function updater and writes the computed value synchronously', () => {
        localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ [storageKey]: 'old' }))
        const { result } = renderHook(() => useLocalStorage<string, string>(storageKey, 'old'))

        act(() => {
            result.current[1]((prev) => `${prev}-updated`)
            const stored = JSON.parse(localStorage.getItem(DEFAULT_STORAGE_KEY) ?? '{}')
            expect(stored[storageKey]).toBe('old-updated')
        })
    })
})
