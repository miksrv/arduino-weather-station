// eslint-disable-next-line jest/no-mocks-import
import '@testing-library/jest-dom/extend-expect'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'

import { setLanguage } from '../app/languageSlice'
import { store } from '../app/store'

import { server } from '../__mocks__/server'
import Statistic from '../features/statistic'
import translate from '../functions/translate'

describe('Test Statistic feature', () => {
    const language = translate()

    beforeAll(() => server.listen())

    afterEach(() => server.resetHandlers())

    afterAll(() => server.close())

    it('Checked correct toolbar', async () => {
        store.dispatch(setLanguage(language))

        render(
            <Provider store={store}>
                <Statistic />
            </Provider>
        )

        expect(
            await screen.findByText(language.toolbar.periods.day)
        ).toBeInTheDocument()
        expect(
            await screen.findByText(language.toolbar.periods.week)
        ).toBeInTheDocument()
        expect(
            await screen.findByText(language.toolbar.periods.month)
        ).toBeInTheDocument()
    })
})
