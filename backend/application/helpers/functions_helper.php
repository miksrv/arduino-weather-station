<?php
defined('BASEPATH') OR exit('No direct script access allowed');

if ( ! function_exists('debug')) {
    function debug($data)
    {
        echo '<pre>';
        var_dump($data);
        echo '</pre>';
    }
}

if ( ! function_exists('timestamp_to_time')) {
    /**
     * Formats a date and time in time only
     * @param datetime $timestamp
     * @return datetime
     */
    function timestamp_to_time($timestamp) {
        return date('H:i', $timestamp);
    } // function timestamp_to_time($timestamp)
}