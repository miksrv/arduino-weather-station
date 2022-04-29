import React from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { store } from '../app/store'
import { setLanguage } from '../app/languageSlice'
import translate from '../functions/translate'

import '@testing-library/jest-dom/extend-expect'

import Header from '../components/header'
import Sidebar from '../components/sidebar'

describe('Test Header and Sidebar components', () => {
    const language = translate()

    beforeEach(() => {
        store.dispatch(setLanguage(language))

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <Header />
                    <Sidebar />
                </BrowserRouter>
            </Provider>
        )
    })

    it('Checked correct show header and sidebar', async () => {
        expect(store.getState().sidebar.visible).toBeFalsy()
        expect(screen.queryByText(/Loading.../)).toBeInTheDocument()
        expect(screen.queryByText(language.sidebar.dashboard)).toBeInTheDocument()
        expect(screen.queryByText(language.sidebar.sensors)).toBeInTheDocument()
        expect(screen.queryByText(language.sidebar.statistic)).toBeInTheDocument()
        expect(screen.queryByText(language.sidebar.heatmap)).toBeInTheDocument()

        fireEvent.click(await screen.findByTestId(/open-menu/))

        expect(store.getState().sidebar.visible).toBeTruthy()

        fireEvent.click(await screen.findByText(language.sidebar.dashboard))
        fireEvent.click(await screen.findByText(language.sidebar.sensors))
        fireEvent.click(await screen.findByText(language.sidebar.statistic))
        fireEvent.click(await screen.findByText(language.sidebar.heatmap))

        expect(store.getState().sidebar.visible).toBeFalsy()
    })
})
