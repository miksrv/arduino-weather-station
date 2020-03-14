import React, { Component } from 'react'
import { connect } from 'react-redux'
import { } from 'semantic-ui-react'

import * as meteoActions from '../store/meteostation/actions'

class Summary extends Component {
  state = {
    intervalId: null
  }

  componentDidMount() {
    const { dispatch } = this.props

    // dispatch(meteoActions.fetchMeteoData())

    var intervalId = setInterval(() => {
          // dispatch(meteoActions.fetchMeteoData())
    }

        , 3000);

    this.setState({intervalId: intervalId});
  }

  componentWillUnmount() {
    this.clearInterval(this.state.intervalId)
  }

  render() {
    console.log('this.props.current', this.props.current);

    return (
        <div>Summary<br />{this.props.current.datestamp}

        </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    current: state.meteostation.current
  }
}

export default connect(mapStateToProps)(Summary);