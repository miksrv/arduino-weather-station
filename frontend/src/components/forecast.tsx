import React from 'react'
import Carousel from 'react-elastic-carousel'
import { Dimmer, Grid, Loader } from 'semantic-ui-react'
import { IForecastItem } from '../app/types'
import { useGetForecastQuery } from '../app/weatherApi'

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
                        {item.time}
                    </div>
                    <div className='desc'>
                        {item.clouds}
                    </div>
                    <div className='image'>
                        ICON
                    </div>
                    <div className='temp'>
                        {item.temperature} <span className='sign'>°</span>
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
