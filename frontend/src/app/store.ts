import { configureStore } from '@reduxjs/toolkit'

import languageSlice from './languageSlice'
import sidebarSlice from './sidebarSlice'
import updateSlice from './updateSlice'
import { weatherApi } from './weatherApi'

export const store = configureStore({
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(weatherApi.middleware),
    reducer: {
        language: languageSlice,
        sidebar: sidebarSlice,
        update: updateSlice,

        // Add the generated reducer as a specific top-level slice
        [weatherApi.reducerPath]: weatherApi.reducer
    }
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
