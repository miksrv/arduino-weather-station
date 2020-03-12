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