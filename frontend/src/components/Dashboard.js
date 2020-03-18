import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Container, Dimmer, Loader, Grid } from 'semantic-ui-react'

import _ from 'lodash'

import Sensor from '../layouts/Sensor';

import data from '../data/sensors'

class Dashboard extends Component {
    render() {
        const { current } = this.props

        return (
            <Container className='tiles-list'>
                <Grid>
                { ! _.isEmpty(current) && data.map((item, key) => (
                    <Grid.Column computer={4} tablet={8} mobile={16} key={key}>
                        <Sensor
                            name={item.name}
                            color={item.color}
                            icon={item.icon}
                            trend={item.trend}
                            average={current[item.value].avg}
                            value={current[item.value].cur}
                        />
                    </Grid.Column>
                )) || (
                    <Dimmer active>
                        <Loader>Loading</Loader>
                    </Dimmer>
                )}
                </Grid>
            </Container>
        );
    }
}


function mapStateToProps(state) {
    return {
        current: state.meteostation.current
    }
}

export default connect(mapStateToProps)(Dashboard);