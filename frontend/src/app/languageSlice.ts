import { createSlice } from '@reduxjs/toolkit'

interface ILanguageState {
    translate: any
}

const initialState: ILanguageState = {
    translate: {}
}

export const languageSlice = createSlice({
    name: 'language',
    initialState,
    reducers: {
        setLanguage: (state, action) => {
            state.translate = action.payload
        }
    }
})

export const { setLanguage } = languageSlice.actions

export default languageSlice.reducer
