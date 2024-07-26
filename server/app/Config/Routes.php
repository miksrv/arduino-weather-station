<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->cli('system/current', 'System::getCurrentWeather'); // php index.php system current

$routes->get('poi', 'Poi::list');
$routes->get('poi/photos', 'Poi::photos');
$routes->get('poi/users', 'Poi::users');
$routes->get('poi/(:alphanum)', 'Poi::show/$1');
$routes->options('poi', 'Poi');
$routes->options('poi/(:alphanum)', 'Poi');
