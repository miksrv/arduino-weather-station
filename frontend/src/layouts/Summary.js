import React from 'react'
import { Container } from 'semantic-ui-react'
import { WiDaySunny } from 'react-icons/wi'

import moment from 'moment'

const Summary = (props) => {
    const { data, updateTimer }  = props

    return (
        <div className='summary'>
            <div className='background-overlay'>
                <div className='background-image' style={{backgroundImage: 'url(/background/spring-sunrise.jpg)'}}></div>
            </div>
            <Container className='main-content'>
                <h1>Погодная станция</h1>
                <h4>Россия, г. Оренбург, ул. Чкалова</h4>
                <div className='current'>
                    <WiDaySunny className='icon' />
                    <span className='value'>{data.temp1.cur}</span>
                    <span className='sign'>℃</span>
                </div>
                <div className='update'>Обновлено: {moment.unix(data.datestamp).format("DD.MM.Y, H:mm:ss")}</div>
                <div className='timeago'>Последние данные: {updateTimer}</div>
            </Container>
        </div>
    )
}

export default Summary