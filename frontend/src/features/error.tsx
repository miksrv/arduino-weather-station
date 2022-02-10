import React from 'react'
import translate from '../functions/translate'

const lang = translate().error

const Error: React.FC = () =>
    <div className='error404'>
        <h1>Oops!</h1>
        <h2>{lang.header}</h2>
        <p>{lang.subtitle}</p>
    </div>

export default Error
