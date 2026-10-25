import React from 'react'
import type { Thing, WithContext } from 'schema-dts'

interface JsonLdProps {
    data: WithContext<Thing> | Array<WithContext<Thing>>
}

/** Schema.org structured data. `<` is escaped so a string in the data can never close the script tag. */
const JsonLd: React.FC<JsonLdProps> = ({ data }) => (
    <script
        type={'application/ld+json'}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
)

export default JsonLd
