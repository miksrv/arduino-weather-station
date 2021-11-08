<?php

/**
 * Print var_dump with formatted tag (<pre>)
 * @param $value
 */
function debug($value)
{
    echo '<pre>';
    var_dump($value);
    echo '</pre>';
}