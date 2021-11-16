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
            pagination={true}
            itemPadding={[0, 5]}
            isRTL={false}
        >
            {data.map((item, key) => (
                <div className='forecast-tile' key={key}>
                    <div className='date'>
                        <div className='day-of-week'>{moment.unix(item.time).format('dddd')}</div>
                        <div className='date-time'>{moment.unix(item.time).format('DD MMMM, H:mm')}</div>
                    </div>
                    <div className='image'>
                        {weatherConditions(item.condition_id).icon}
                    </div>
                    <div className='temp'>
                        {item.temperature}°
                    </div>
                    <div className='desc'>
                        {weatherConditions(item.condition_id).name}
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
