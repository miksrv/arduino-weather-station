import React from 'react'
import { Helmet } from 'react-helmet'
import translate from '../functions/translate'
import Dashboard from '../components/dashboard'
import Carousel from '../components/forecast'

const lang = translate().pages.main

const Main: React.FC = () =>
    <>
        <Helmet>
            <title>{lang.title}</title>
            <meta name='description' content={lang.description} />
        </Helmet>
        <Dashboard />
        <br />
        <Carousel />
    </>

export default Main
