import { createSlice } from '@reduxjs/toolkit'

interface ISidebarState {
    visible: boolean
}

const initialState: ISidebarState = {
    visible: false,
}

export const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        show: (state) => {
            state.visible = true
        },
        hide: (state) => {
            state.visible = false
        },
        toggle: (state) => {
            state.visible = !state.visible
        }
    }
})

export const { show, hide, toggle } = sidebarSlice.actions

export default sidebarSlice.reducer
