import React, {useEffect} from 'react'
import Sensor from '../components/sensor'
import { ISensorItem } from '../app/types'
import { useAppDispatch } from '../app/hooks'
import { useGetSensorsQuery } from '../app/weatherApi'
import { Grid } from 'semantic-ui-react'
import { setUpdate } from '../app/updateSlice'

const Sensors: React.FC = () => {
    const dispatch = useAppDispatch()
    const { data, isSuccess } = useGetSensorsQuery(null, {pollingInterval: 60 * 1000})

    useEffect(() => {
        dispatch(setUpdate(data?.timestamp))
    }, [data])

    return (
        <Grid>
            {isSuccess && data?.payload.map((item: ISensorItem, key: number) =>
                <Grid.Column computer={4} tablet={8} mobile={16} key={key}>
                    <Sensor data={item} />
                </Grid.Column>
            )}
        </Grid>
    )
}

export default Sensors
