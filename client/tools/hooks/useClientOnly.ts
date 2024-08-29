import { useEffect, useState } from 'react'

const useClientOnly = () => {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    return isClient
}

export default useClientOnly
