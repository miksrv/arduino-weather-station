import React from 'react'
import { Container, Dimmer, Loader, Grid } from 'semantic-ui-react'

import Sensor from './Sensor'

import sensors from '../data/sensors'

const Dashboard = (props) => {
    const { data } = props

    return (
        <Container className='tiles-list'>
            <Grid>
                {sensors.map((item, key) => (
                    <Grid.Column computer={4} tablet={8} mobile={16} key={key}>
                        <Sensor
                            name={item.name}
                            color={item.color}
                            icon={item.icon}
                            trend={item.trend}
                            average={data[item.value].avg}
                            value={data[item.value].cur}
                        />
                    </Grid.Column>
                )) || (
                    <Dimmer active>
                        <Loader>Загрузка</Loader>
                    </Dimmer>
                )}
            </Grid>
        </Container>
    )
}

export default Dashboard