/**
 * React weather icons: https://react-icons.netlify.com/#/icons/wi
 */

import React  from 'react'
import moment from 'moment'

import { Grid, Dimmer, Loader } from 'semantic-ui-react'
import { WiThermometer } from 'react-icons/wi'

import _ from 'lodash'

const Extreme = params => {
    const COLOR = params.type === 'min' ? 'blue' : 'red',
          TITLE = params.type === 'min' ?
                    'Минимальная температура' :
                    'Максимальная температура'

    return (
        <div className={'informer ' + COLOR}>
            {
                _.isEmpty(params.data) && (
                    <Dimmer active>
                        <Loader />
                    </Dimmer>
                )
            }
            <div className='title'>{TITLE}</div>
            <div className='grid-info date'>
                {!_.isEmpty(params.data) ? moment.unix(params.data.time).format('LLLL') : 'Идёт загрузка...'}
            </div>
            <Grid>
                <Grid.Row className='row-value'>
                    <Grid.Column width={9} className='icon-container'>
                        <div className='value'>
                            {!_.isEmpty(params.data) ? (params.data.val > 0 && '+') + params.data.val : '000'} <span className='sign'>℃</span>
                        </div>
                    </Grid.Column>
                    <Grid.Column width={7}>
                        <WiThermometer className='icon' />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </div>
    )
}

export default Extreme