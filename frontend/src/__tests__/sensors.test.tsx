import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '../app/store'
import { setLanguage } from '../app/languageSlice'
import translate from '../functions/translate'

import '@testing-library/jest-dom/extend-expect'

// eslint-disable-next-line jest/no-mocks-import
import { server } from '../__mocks__/server'
import { ISensorItem } from '../app/types'
// eslint-disable-next-line jest/no-mocks-import
import sensorsData from '../__mocks__/rest/sensors'

import Sensors from '../features/sensors'

describe('Test Sensors feature', () => {
    const language = translate()

    beforeAll(() => server.listen())

    beforeEach(() => {
        store.dispatch(setLanguage(language))

        render(
            <Provider store={store}>
                <Sensors/>
            </Provider>
        )
    })

    afterEach(() => server.resetHandlers())

    afterAll(() => server.close())

    it('Checked correct show sensors value', async () => {
        sensorsData.payload.map(async (item: ISensorItem) => {
            expect(await screen.findByText(item.value)).toBeInTheDocument()
        })
    })
})
