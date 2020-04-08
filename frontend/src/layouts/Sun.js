/**
 * React weather icons: https://react-icons.netlify.com/#/icons/wi
 */

import React  from 'react'

import { Grid } from 'semantic-ui-react'
import { WiSunrise, WiSunset } from 'react-icons/wi'

import moment from 'moment'

const Sun = (params) => {
    return (
        <div className={'tile sun ' + params.widget.color}>
            <Grid>
                <Grid.Column width={5} className='icon-container'>
                    <WiSunset className='icon' />
                </Grid.Column>
                <Grid.Column width={11}>
                    <div className='title'>{params.widget.name}</div>
                    <div className='description'>Рассвет: <span className='value'>{moment.unix(params.data.rise).format("H:mm")}</span></div>
                    <div className='description'>Закат: <span className='value'>{moment.unix(params.data.set).format("H:mm")}</span></div>
                </Grid.Column>
            </Grid>
        </div>
    )
}

export default Sun