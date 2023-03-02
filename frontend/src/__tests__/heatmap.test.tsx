// eslint-disable-next-line jest/no-mocks-import
import '@testing-library/jest-dom/extend-expect'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'

import { setLanguage } from '../app/languageSlice'
import { store } from '../app/store'

import { server } from '../__mocks__/server'
import Heatmap from '../features/heatmap'
import translate from '../functions/translate'

describe('Test Heatmap feature', () => {
    const language = translate()

    beforeAll(() => server.listen())

    afterEach(() => server.resetHandlers())

    afterAll(() => server.close())

    it('Checked correct toolbar', async () => {
        store.dispatch(setLanguage(language))

        render(
            <Provider store={store}>
                <Heatmap />
            </Provider>
        )

        expect(
            await screen.findByText(language.toolbar.periods.month)
        ).toBeInTheDocument()
        expect(
            await screen.findByText(language.toolbar.periods.quarter)
        ).toBeInTheDocument()
        expect(
            await screen.findByText(language.toolbar.periods.halfyear)
        ).toBeInTheDocument()
        expect(
            await screen.findByText(language.toolbar.periods.year)
        ).toBeInTheDocument()
    })
})
