import { createSlice } from '@reduxjs/toolkit'

interface ISidebarState {
    visible: boolean
}

const initialState: ISidebarState = {
    visible: false
}

export const sidebarSlice = createSlice({
    initialState,
    name: 'sidebar',
    reducers: {
        hide: (state) => {
            state.visible = false
        },
        show: (state) => {
            state.visible = true
        },
        toggle: (state) => {
            state.visible = !state.visible
        }
    }
})

export const { show, hide, toggle } = sidebarSlice.actions

export default sidebarSlice.reducer
