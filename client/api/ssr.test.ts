import { prefetchQueries } from './ssr'
import type { AppStore } from './store'

jest.mock('./api', () => ({
    API: { util: { getRunningQueriesThunk: () => 'running-queries' } }
}))

const makeStore = (running: Array<Promise<unknown>>) => {
    const dispatch = jest.fn((action: unknown) => (action === 'running-queries' ? running : action))

    return { store: { dispatch } as unknown as AppStore, dispatch }
}

describe('prefetchQueries', () => {
    afterEach(() => {
        jest.useRealTimers()
    })

    it('dispatches every action and waits for the running queries', async () => {
        let resolveQuery: () => void = () => undefined
        const query = new Promise<void>((resolve) => {
            resolveQuery = resolve
        })
        const { store, dispatch } = makeStore([query])

        let done = false
        const prefetch = prefetchQueries(store, ['a' as never, 'b' as never]).then(() => {
            done = true
        })

        expect(dispatch).toHaveBeenCalledWith('a')
        expect(dispatch).toHaveBeenCalledWith('b')

        await Promise.resolve()
        expect(done).toBe(false)

        resolveQuery()
        await prefetch
        expect(done).toBe(true)
    })

    it('does not fail when a query rejects', async () => {
        const { store } = makeStore([Promise.reject(new Error('API down'))])

        await expect(prefetchQueries(store, [])).resolves.toBeUndefined()
    })

    it('gives up after the timeout', async () => {
        jest.useFakeTimers()
        const { store } = makeStore([new Promise(() => undefined)])

        const prefetch = prefetchQueries(store, [], 1000)
        jest.advanceTimersByTime(1000)

        await expect(prefetch).resolves.toBeUndefined()
    })
})
