import { useEffect } from 'react'

import { urlAPI } from '@/api/api'

/**
 * Registers `public/sw.js` once the page has loaded, so it doesn't compete with the first render.
 * The worker caches the API origin as well, which it learns from the registration URL.
 */
const useServiceWorker = (enabled: boolean) => {
    useEffect(() => {
        if (!enabled || !('serviceWorker' in navigator)) {
            return
        }

        const register = () => {
            navigator.serviceWorker
                .register(`/sw.js?api=${encodeURIComponent(new URL(urlAPI).origin)}`)
                .catch((error: unknown) => console.error('Service worker registration failed', error))
        }

        if (document.readyState === 'complete') {
            register()
            return
        }

        window.addEventListener('load', register, { once: true })

        return () => window.removeEventListener('load', register)
    }, [enabled])
}

export default useServiceWorker
