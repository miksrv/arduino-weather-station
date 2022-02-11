import React from 'react'
import translate from '../functions/translate'
import { Helmet } from 'react-helmet'

const lang = translate().error

const Error: React.FC = () =>
    <div className='error404'>
        <Helmet>
            <title>{lang.header}</title>
            <meta name='description' content={lang.subtitle} />
        </Helmet>
        <h1>Oops!</h1>
        <h2>{lang.header}</h2>
        <p>{lang.subtitle}</p>
    </div>

export default Error
