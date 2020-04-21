import React from 'react'
import { Container, Dimmer, Loader, Grid } from 'semantic-ui-react'

import Sensor from './Sensor'
import Moon from './Moon'
import Sun from './Sun'

import sensors from '../data/sensors'

const Dashboard = (props) => {
    const { data } = props

    return (
        <Container className='tiles-list'>
            <Grid>
                {sensors.map((item, key) => {
                            switch (item.type) {
                                case 'sensors': return (
                                    <Sensor
                                        widget={item}
                                        data={data[item.type][item.source]}
                                    />
                                )

                                case 'sun': return (
                                    <Sun
                                        widget={item}
                                        data={data[item.type]}
                                    />
                                )

                                case 'moon': return (
                                    <Moon
                                        data={data[item.type]}
                                    />
                                )

                                default: return null
                            }

                }) || (
                    <Dimmer active>
                        <Loader>Загрузка</Loader>
                    </Dimmer>
                )}
            </Grid>
        </Container>
    )
}

export default Dashboard