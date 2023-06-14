import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { Dimmer, Grid, Loader, Message } from 'semantic-ui-react'

import { useAppDispatch, useAppSelector } from 'app/hooks'
import { ISensorItem } from 'app/types'
import { setUpdate } from 'app/updateSlice'
import { useGetSensorsQuery } from 'app/weatherApi'

import Sensor from 'components/sensor'

const SensorLoader: React.FC = () => (
    <>
        {Array(12)
            .fill(1)
            .map((el) => (
                <Grid.Column
                    computer={4}
                    tablet={8}
                    mobile={16}
                    key={el}
                >
                    <div
                        className='box sensor'
                        style={{ height: 120 }}
                    >
                        <Dimmer active>
                            <Loader />
                        </Dimmer>
                    </div>
                </Grid.Column>
            ))}
    </>
)

const SensorError: React.FC = () => {
    const language = useAppSelector((state) => state.language.translate)

    return (
        <Grid.Column width={16}>
            <Message negative>
                <Message.Header>{language.general.error.title}</Message.Header>
                <p>{language.general.error.description}</p>
            </Message>
        </Grid.Column>
    )
}

const Sensors: React.FC = () => {
    const dispatch = useAppDispatch()
    const language = useAppSelector((state) => state.language.translate)
    const { data, isFetching, isSuccess } = useGetSensorsQuery(null, {
        pollingInterval: 60 * 1000
    })

    useEffect(() => {
        dispatch(setUpdate(data?.timestamp))
    }, [dispatch, data])

    return (
        <>
            <Helmet>
                <title>{language.pages.sensors.title}</title>
                <meta
                    name='description'
                    content={language.pages.sensors.description}
                />
            </Helmet>
            <Grid>
                {!isFetching ? (
                    isSuccess ? (
                        data?.payload.map((item: ISensorItem) => (
                            <Grid.Column
                                computer={4}
                                tablet={8}
                                mobile={16}
                                key={item.name}
                            >
                                <Sensor data={item} />
                            </Grid.Column>
                        ))
                    ) : (
                        <SensorError />
                    )
                ) : (
                    <SensorLoader />
                )}
            </Grid>
        </>
    )
}

export default Sensors
