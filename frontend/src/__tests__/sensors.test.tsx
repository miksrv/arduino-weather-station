import '@testing-library/jest-dom/extend-expect'
import { render, screen } from '@testing-library/react'
import sensorsData from '__mocks__/rest/sensors'
import { server } from '__mocks__/server'
import Sensors from 'features/sensors'
import React from 'react'
import { Provider } from 'react-redux'

import { setLanguage } from 'app/languageSlice'
import { store } from 'app/store'
import { ISensorItem } from 'app/types'

import translate from 'functions/translate'

describe('Test Sensors feature', () => {
    const language = translate()

    beforeAll(() => server.listen())

    afterEach(() => server.resetHandlers())

    afterAll(() => server.close())

    it('Checked correct show sensors value', async () => {
        store.dispatch(setLanguage(language))

        render(
            <Provider store={store}>
                <Sensors />
            </Provider>
        )

        sensorsData.payload.map(async (item: ISensorItem) => {
            expect(await screen.findByText(item.value)).toBeInTheDocument()
        })
    })
})
