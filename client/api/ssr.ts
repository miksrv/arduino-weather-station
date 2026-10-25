import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'

import { API } from './api'
import type { AppStore, RootState } from './store'

/** How long a server render waits for the API before it gives up and lets the browser load the data. */
export const SSR_PREFETCH_TIMEOUT = 2500

/** An RTK Query `initiate()` thunk, e.g. `API.endpoints.getCurrent.initiate()` */
type PrefetchAction = ThunkAction<unknown, RootState, unknown, UnknownAction>

/**
 * Runs RTK Query requests during `getServerSideProps`, so the page HTML carries the data (crawlers and
 * the first paint see the readings, not skeletons). The results are hydrated into the browser store
 * (`extractRehydrationInfo` in `api.ts`); the client hooks must ask with the same arguments to reuse them.
 * A slow or failing API never blocks the page: after `timeout` the render goes on without the data.
 */
export const prefetchQueries = async (
    store: AppStore,
    actions: PrefetchAction[],
    timeout: number = SSR_PREFETCH_TIMEOUT
): Promise<void> => {
    actions.forEach((action) => store.dispatch(action))

    let timer: ReturnType<typeof setTimeout> | undefined

    await Promise.race([
        Promise.allSettled(store.dispatch(API.util.getRunningQueriesThunk())),
        new Promise<void>((resolve) => {
            timer = setTimeout(resolve, timeout)
        })
    ])

    clearTimeout(timer)
}
