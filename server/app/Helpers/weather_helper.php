<?php

if (!function_exists('kmh_to_ms')) {
    /**
     * Convert speed from kilometers per hour to meters per second.
     *
     * @param float $speed Speed in kilometers per hour.
     * @return float Speed in meters per second.
     */
    function kmh_to_ms(float $speed): float
    {
        return $speed * 1000 / 3600;
    }
}