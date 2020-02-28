import React, { Component } from 'react'
import { connect } from 'react-redux'
import { } from 'semantic-ui-react'

import * as meteoActions from '../store/meteostation/actions'

class Summary extends Component {
  componentDidMount() {
    const { dispatch } = this.props

    dispatch(meteoActions.fetchMeteoData())
  }

  render() {
    return (
        <div>Summary</div>
    );
  }
}

function mapStateToProps(state) {
  return {}
}

export default connect(mapStateToProps)(Summary);