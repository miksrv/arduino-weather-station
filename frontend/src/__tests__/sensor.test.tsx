import '@testing-library/jest-dom/extend-expect'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'

import { setLanguage } from '../app/languageSlice'
import { store } from '../app/store'
import { ISensorItem } from '../app/types'

import Sensor from '../components/sensor'
import translate from '../functions/translate'

describe('Test Sensor component', () => {
    const language = translate()

    beforeEach(() => {
        store.dispatch(setLanguage(language))
    })

    it('Checked correct show sensors value', async () => {
        const sensorData: ISensorItem = {
            max: 25,
            min: 20,
            name: 'temp',
            trend: 1,
            type: 'temperature',
            value: 23
        }

        render(
            <Provider store={store}>
                <Sensor data={sensorData} />
            </Provider>
        )

        expect(await screen.findByText(sensorData.value)).toBeInTheDocument()
        expect(
            await screen.findByText(`max: ${sensorData.max}`)
        ).toBeInTheDocument()
        expect(
            await screen.findByText(`min: ${sensorData.min}`)
        ).toBeInTheDocument()
    })
})
