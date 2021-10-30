import React from 'react'
import Sensor from '../components/sensor'
import { ISensorItem } from '../app/types'
import { useGetSensorsQuery } from '../app/weatherApi'
import { Grid } from 'semantic-ui-react'

const Sensors: React.FC = () => {

    const { data, isLoading, isSuccess } = useGetSensorsQuery(null);

    console.log('useGetSensorsQuery', data)

    return (
        <Grid>
            {isSuccess && data?.payload.map((item: ISensorItem, key: number) =>
                <Grid.Column computer={4} tablet={8} mobile={16}>
                    <Sensor key={key} data={item} />
                </Grid.Column>
            )}
        </Grid>
    )
}

export default Sensors
