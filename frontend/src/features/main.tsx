import React from 'react'
import { Helmet } from 'react-helmet'

import { useAppSelector } from 'app/hooks'

import Dashboard from 'components/dashboard'
import Carousel from 'components/forecast'

const Main: React.FC = () => {
    const language = useAppSelector((state) => state.language.translate)

    return (
        <>
            <Helmet>
                <title>{language.pages.main.title}</title>
                <meta
                    name='description'
                    content={language.pages.main.description}
                />
            </Helmet>
            <Dashboard />
            <br />
            <Carousel />
        </>
    )
}

export default Main
