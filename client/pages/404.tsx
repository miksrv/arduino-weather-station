import React from 'react'
import { NextPage } from 'next'
import { NextSeo } from 'next-seo'

import Button from '@/ui/button'

interface NotFoundProps {}

const NotFound: NextPage<NotFoundProps> = () => (
    <div className={'page404'}>
        <NextSeo
            nofollow={true}
            noindex={true}
        />
        <div className={'container'}>
            <h1>{'404'}</h1>
            <Button
                mode={'primary'}
                size={'medium'}
                link={'/'}
            >
                {'Go back to the main page'}
            </Button>
        </div>
    </div>
)

export default NotFound
