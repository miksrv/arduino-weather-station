import React from 'react'

import Dashboard from '../components/dashboard'
import Carousel from '../components/forecast'

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
