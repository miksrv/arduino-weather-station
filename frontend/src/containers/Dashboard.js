import React, { Component } from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'

import { Container } from 'semantic-ui-react'

import Sensor from '../layouts/Sensor';

class Dashboard extends Component {
    render() {
        const { current } = this.props

        return (
            <Container>
                Dashboard
                <Sensor value={current.temp} />
                {/*{( ! _.isEmpty(this.props.sensors)) && (*/}
                {/*    <Sensor value='23' />*/}
                {/*) || (*/}
                {/*    <div>Пусто</div>*/}
                {/*)}*/}
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