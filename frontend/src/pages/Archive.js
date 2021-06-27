import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Dimmer, Loader, Grid, Button, Icon, Message } from 'semantic-ui-react'

import MainContainer from '../components/MainContainer'
import ArchiveStat from '../components/ArchiveStat'

import moment from 'moment'

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'
import FullStats from "../components/FullStats";

class Statistic extends Component {

    state = {
        loader: false
    }

    componentDidMount() {
        const { dispatch, storeStatistic } = this.props

        dispatch(meteoActions.fetchHeatMap())
        // const { rangeStart, rangeEnd } = this.state
        // const { urlStart, urlEnd } = this.getDateFromUrl()

        // let last_update = (! _.isEmpty(storeStatistic) ? moment().unix() - storeStatistic.update : null)
        //
        // if (last_update === null || (last_update < -180 || last_update > 180))
        //     dispatch(meteoActions.fetchDataStatistic(
        //         moment(urlStart ? urlStart : rangeStart).format('YYYY-MM-DD'),
        //         moment(urlEnd ? urlEnd : rangeEnd).format('YYYY-MM-DD')
        //     ))
    }

    render() {
        const { storeHeatMap } = this.props
        const { loader } = this.state

        return (
            <MainContainer
                updateTime={moment().unix()}
                title='Статистика'
            >
                <Container>
                    { (! _.isEmpty(storeHeatMap) && ! _.isEmpty(storeHeatMap.data) && ! loader) ? (
                        <ArchiveStat
                            storeStatistic={storeHeatMap}
                            onChangePeriod={this.changePeriod}
                        />
                    ) : (
                        <Grid>
                            <Grid.Column computer={16} tablet={16} mobile={16}>
                                <div className='informer' style={{height: 330}}>
                                    <Dimmer active>
                                        <Loader />
                                    </Dimmer>
                                </div>
                            </Grid.Column>
                        </Grid>
                    )}
                </Container>
            </MainContainer>
        )
    }
}

function mapStateToProps(state) {
    return {
        storeHeatMap: state.meteostation.storeHeatMap
    }
}

export default connect(mapStateToProps)(Statistic)