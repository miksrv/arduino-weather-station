import React from 'react'

import Carousel from 'react-elastic-carousel' // https://sag1v.github.io/react-elastic-carousel/styling

import moment from 'moment'

import WeatherIcon from '../data/WeatherIcon'

/**
 * 200, 201, 202 WiDaySnowThunderstorm
 * 210, 211, 212
 */

const ForeacstTile = props => {
    const { data } = props

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
        >
            {data.map((item, key) => (
                <div className='forecast-tile' key={key}>
                    <div className='date'>
                        {moment.unix(item.dt).format("ddd, DD MMM, H:mm")}
                    </div>
                    <div className='desc'>
                        {item.weather[0].description}
                    </div>
                    <div className='image'>
                        <WeatherIcon code={item.weather[0].id} daytime={item.sys.pod}  />
                    </div>
                    <div className='temp'>
                        {(item.main.temp > 0) && ('+')}{Number((item.main.temp).toFixed(0))}<span className='sign'>°</span>
                        {/*{valueColor(Number((item.main.temp).toFixed(0)))}<span className='sign'>℃</span>*/}
                    </div>
                    {/*<div className='wind'>*/}
                    {/*    {Number((item.wind.speed).toFixed(0))}<span className='sign'>м\с</span>*/}
                    {/*</div>*/}
                </div>
            ))}
        </Carousel>
    )
}

export default ForeacstTile