import { createSlice } from '@reduxjs/toolkit'

interface IUpdateState {
    timestamp: {
        server: number,
        update: number,
    },
}

const initialState: IUpdateState = {
    timestamp: {
        server: 0,
        update: 0,
    },
}

export const updateSlice = createSlice({
    name: 'update',
    initialState,
    reducers: {
        setUpdate: (state, action) => {
            state.timestamp = action.payload
        }
    }
})

export const { setUpdate } = updateSlice.actions

export default updateSlice.reducer
