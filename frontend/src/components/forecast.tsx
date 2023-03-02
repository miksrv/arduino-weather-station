import moment from 'moment'
import React from 'react'
import Carousel from 'react-elastic-carousel'
import { Dimmer, Grid, Loader } from 'semantic-ui-react'

import { useAppSelector } from 'app/hooks'
import { IForecastItem } from 'app/types'
import { useGetForecastQuery } from 'app/weatherApi'

import { getLanguage } from 'functions/translate'
import { weatherConditions } from 'functions/weatherConditions'

const breakPoints = [
    { itemsToShow: 2, width: 1 },
    { itemsToShow: 3, width: 550 },
    { itemsToShow: 6, width: 850 }
]

const renderCarousel = (data: IForecastItem[], language: any) => (
    <Carousel
        breakPoints={breakPoints}
        itemsToScroll={1}
        pagination={true}
        itemPadding={[0, 5]}
        isRTL={false}
    >
        {data.map((item, key) => (
            <div
                className='forecast-tile'
                key={key}
            >
                <div className='date'>
                    <div className='day-of-week'>
                        {moment.unix(item.time).format('dddd')}
                    </div>
                    <div className='date-time'>
                        {moment.unix(item.time).format('DD MMMM, H:mm')}
                    </div>
                </div>
                <div className='image'>
                    {weatherConditions(item.condition_id, language).icon}
                </div>
                <div className='temp'>{item.temperature}°</div>
                <div className='desc'>
                    {weatherConditions(item.condition_id, language).name}
                </div>
            </div>
        ))}
    </Carousel>
)

const Forecast: React.FC = () => {
    const language = useAppSelector((state) => state.language.translate)
    const { data, isLoading } = useGetForecastQuery(null)

    moment.locale(getLanguage())

    return (
        <>
            {isLoading ? (
                <Grid className='forecast-list-loader'>
                    <Grid.Column
                        computer={16}
                        tablet={16}
                        mobile={16}
                    >
                        <div
                            className='informer'
                            style={{ height: 210 }}
                        >
                            <Dimmer active>
                                <Loader />
                            </Dimmer>
                        </div>
                    </Grid.Column>
                </Grid>
            ) : (
                data?.payload &&
                renderCarousel(data.payload, language.weather.conditions)
            )}
        </>
    )
}

export default Forecast
