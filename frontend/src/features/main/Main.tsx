import React from 'react'

import Dashboard from '../../components/dashboard/Dashboard'
import Carousel from '../../components/forecast/Forecast'

const Main: React.FC = () => {
    return (
        <>
            <Dashboard />
            <br />
            <Carousel />
        </>
    )
}

export default Main
