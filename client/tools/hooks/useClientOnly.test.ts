import { act, renderHook } from '@testing-library/react'

import useClientOnly from './useClientOnly'

describe('useClientOnly', () => {
    it('returns true after mount (useEffect has run)', async () => {
        const { result } = renderHook(() => useClientOnly())
        await act(async () => {
            // allow useEffect to flush
        })
        expect(result.current).toBe(true)
    })

    it('returns a boolean value', () => {
        const { result } = renderHook(() => useClientOnly())
        expect(typeof result.current).toBe('boolean')
    })
})
