import React from 'react'

import { useGetSensorsQuery } from '../../api/weather'

const Sensors: React.FC = () => {

    const { data, isLoading, isSuccess } = useGetSensorsQuery(null);

    console.log('useGetSensorsQuery', data)

    return (
        <div>
            Sensors page
        </div>
    )
}

export default Sensors
