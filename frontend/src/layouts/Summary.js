import React from 'react'
import { Container, Grid } from 'semantic-ui-react'
import { WiDaySunny } from 'react-icons/wi'

import moment from 'moment'

const Summary = (props) => {
    const { data, updateTimer }  = props

    return (
        <div className='summary'>
            <div className='background-overlay'>
                <div className='background-image' style={{backgroundImage: 'url(/background/autumn-day.jpg)'}}></div>
            </div>
            <Container className='main-content'>
                <h1>Погодная станция</h1>
                <h4>Оренбургская обл., c. Ивановка, ЖК "Приуралье"</h4>
                <Grid>
                    <Grid.Row className='current-grid'>
                        <Grid.Column width={2}>
                            <WiDaySunny className='current-icon' />
                        </Grid.Column>
                        <Grid.Column width={5}>
                            <div className='current'>
                                <span className='value'>{data.sensors.t1.value}</span>
                                <span className='sign'>℃</span>
                            </div>
                        </Grid.Column>
                        <Grid.Column width={4} className='minmax-value'>
                            <div>max:
                                <span className='value'>{data.sensors.t1.max}</span>
                                <span className='sign'>℃</span></div>
                            <div>min:
                                <span className='value'>{data.sensors.t1.min}</span>
                                <span className='sign'>℃</span>
                            </div>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
                <div className='update'>Обновлено: {moment.unix(data.update).format("DD.MM.Y, H:mm:ss")}</div>
                <div className='timeago'>Последние данные: {updateTimer}</div>
            </Container>
        </div>
    )
}

export default Summary