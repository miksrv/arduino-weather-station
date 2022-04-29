import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '../app/store'
import { ISensorItem } from '../app/types'
import { setLanguage } from '../app/languageSlice'
import translate from '../functions/translate'

import '@testing-library/jest-dom/extend-expect'

import Sensor from '../components/sensor'


describe('Test Sensor component', () => {
    const language = translate()

    beforeEach(() => {
        store.dispatch(setLanguage(language))
    })

    it('Checked correct show sensors value', async () => {
        const sensorData: ISensorItem = {
            name: 'temp',
            value: 23,
            trend: 1,
            min: 20,
            max: 25,
            type: 'temperature'
        }

        render(
            <Provider store={store}>
                <Sensor data={sensorData} />
            </Provider>
        )

        expect(await screen.findByText(sensorData.value)).toBeInTheDocument();
        expect(await screen.findByText(`max: ${sensorData.max}`)).toBeInTheDocument();
        expect(await screen.findByText(`min: ${sensorData.min}`)).toBeInTheDocument();
    })
})
