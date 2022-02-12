import React from 'react'
import { useAppSelector } from '../app/hooks'
import { Helmet } from 'react-helmet'

const Error: React.FC = () => {
    const language = useAppSelector(state => state.language.translate)

    return (
        <div className='error404'>
            <Helmet>
                <title>{language.error.header}</title>
                <meta name='description' content={language.error.subtitle} />
            </Helmet>
            <h1>Oops!</h1>
            <h2>{language.error.header}</h2>
            <p>{language.error.subtitle}</p>
        </div>
    )
}

export default Error
