import React from 'react'
import Carousel from 'react-elastic-carousel'
import { Dimmer, Grid, Loader } from 'semantic-ui-react'
import { IForecastItem } from '../app/types'
import { useGetForecastQuery } from '../app/weatherApi'
import { weatherConditions } from '../functions/weatherConditions'

import moment from 'moment'

const renderCarousel = (data: IForecastItem[]) => {
    const breakPoints = [
        { width: 1, itemsToShow: 2},
        { width: 550, itemsToShow: 3},
        { width: 850, itemsToShow: 6}
    ]

    return (
        <Carousel
            breakPoints={breakPoints}
            itemsToScroll={1}
            pagination={false}
            itemPadding={[0, 5]}
            isRTL
        >
            {data.map((item, key) => (
                <div className='forecast-tile' key={key}>
                    <div className='date'>
                        {moment.unix(item.time).format('ddd, DD MMM, H:mm')}
                    </div>
                    <div className='desc'>
                        {weatherConditions(item.condition_id).name}
                    </div>
                    <div className='image'>
                        {weatherConditions(item.condition_id).icon}
                    </div>
                    <div className='temp'>
                        {item.temperature}°
                    </div>
                </div>
            ))}
        </Carousel>
    )
}

const Forecast: React.FC = () => {
    const { data, isLoading } = useGetForecastQuery(null)

    return (
        <>
            {isLoading ? (
                <Grid className='forecast-list-loader'>
                    <Grid.Column computer={16} tablet={16} mobile={16}>
                        <div className='informer' style={{height: 210}}>
                            <Dimmer active>
                                <Loader />
                            </Dimmer>
                        </div>
                    </Grid.Column>
                </Grid>
                ) : data?.payload && renderCarousel(data.payload)
            }
        </>
    )
}

export default Forecast
