import { configureStore } from '@reduxjs/toolkit'
import { weatherApi } from './weatherApi'
import languageSlice from './languageSlice'
import updateSlice from './updateSlice'
import sidebarSlice from './sidebarSlice'

export const store = configureStore({
    reducer: {
        update: updateSlice,
        sidebar: sidebarSlice,
        language: languageSlice,

        // Add the generated reducer as a specific top-level slice
        [weatherApi.reducerPath]: weatherApi.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(weatherApi.middleware),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
