import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Dimmer, Loader, Grid } from 'semantic-ui-react'

import MainContainer from '../components/MainContainer'
import ArchiveStat from '../components/ArchiveStat'

import moment from 'moment'

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'

class Archive extends Component {

    state = {
        loader: false
    }

    componentDidMount() {
        const { dispatch, storeHeatMap } = this.props

        if (_.isEmpty(storeHeatMap))
            dispatch(meteoActions.fetchHeatMap())
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

export default connect(mapStateToProps)(Archive)