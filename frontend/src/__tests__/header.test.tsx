import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '../app/store'
import { setLanguage } from '../app/languageSlice'
import translate from '../functions/translate'

import '@testing-library/jest-dom/extend-expect'

import Header from '../components/header'

describe('Test Header', () => {
    const language = translate()

    beforeEach(() => {
        store.dispatch(setLanguage(language))

        render(
            <Provider store={store}>
                <Header />
            </Provider>
        )
    })

    it('Check correct show header on page', async () => {
        expect(store.getState().sidebar.visible).toBeFalsy()
        expect(screen.queryByText(/Loading.../)).toBeInTheDocument()

        fireEvent.click(await screen.findByTestId(/open-menu/))

        expect(store.getState().sidebar.visible).toBeTruthy()
    })
})
