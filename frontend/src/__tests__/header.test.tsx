import '@testing-library/jest-dom/extend-expect'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import { setLanguage } from 'app/languageSlice'
import { store } from 'app/store'

import translate from 'functions/translate'

import Header from 'components/header'
import Sidebar from 'components/sidebar'

describe('Test Header and Sidebar components', () => {
    const language = translate()
    it('Checked correct show header and sidebar', async () => {
        store.dispatch(setLanguage(language))

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <Header />
                    <Sidebar />
                </BrowserRouter>
            </Provider>
        )

        expect(store.getState().sidebar.visible).toBeFalsy()
        expect(screen.getByText(/Loading.../)).toBeInTheDocument()
        expect(screen.getByText(language.sidebar.dashboard)).toBeInTheDocument()
        expect(screen.getByText(language.sidebar.sensors)).toBeInTheDocument()
        expect(screen.getByText(language.sidebar.statistic)).toBeInTheDocument()
        expect(screen.getByText(language.sidebar.heatmap)).toBeInTheDocument()

        fireEvent.click(await screen.findByTestId(/open-menu/))

        expect(store.getState().sidebar.visible).toBeTruthy()

        fireEvent.click(await screen.findByText(language.sidebar.dashboard))
        fireEvent.click(await screen.findByText(language.sidebar.sensors))
        fireEvent.click(await screen.findByText(language.sidebar.statistic))
        fireEvent.click(await screen.findByText(language.sidebar.heatmap))

        expect(store.getState().sidebar.visible).toBeFalsy()
    })
})
