import React, { useEffect } from 'react'
import { useAppDispatch } from '../app/hooks'
import { useGetSensorsQuery } from '../app/weatherApi'
import { Dimmer, Grid, Loader, Message } from 'semantic-ui-react'
import { setUpdate } from '../app/updateSlice'
import { ISensorItem } from '../app/types'
import Sensor from '../components/sensor'

const SensorLoader = () =>
    Array(12).fill(1).map((el, i) =>
        <Grid.Column computer={4} tablet={8} mobile={16}>
            <div className='box sensor' style={{height: 120}}>
                <Dimmer active>
                    <Loader />
                </Dimmer>
            </div>
        </Grid.Column>
    )

const SensorError = () =>
    <Grid.Column width={16}>
        <Message negative>
            <Message.Header>Удаленный сервер ответил с ошибкой</Message.Header>
            <p>На метеостанции возникла какая-то неполадка, в ближайшее время она будет устранена и все заработает, не расстраивайтесь :)</p>
        </Message>
    </Grid.Column>

const Sensors: React.FC = () => {
    const dispatch = useAppDispatch()
    const { data, isFetching, isSuccess } = useGetSensorsQuery(null, { pollingInterval: 60 * 1000 })

    useEffect(() => {
        dispatch(setUpdate(data?.timestamp))
    }, [dispatch, data])

    return (
        <Grid>
            {!isFetching ?
                isSuccess ? data?.payload.map((item: ISensorItem, key: number) =>
                    <Grid.Column computer={4} tablet={8} mobile={16} key={key}>
                        <Sensor data={item}/>
                    </Grid.Column>
                ) : SensorError()
                : SensorLoader()
            }
        </Grid>
    )
}

export default Sensors
