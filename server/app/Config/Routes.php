<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
//$routes->cli('system/recalculate_tags_count', 'System::calculateTagsCount'); // php index.php system recalculate_tags_count

$routes->get('poi', 'Poi::list');
$routes->get('poi/photos', 'Poi::photos');
$routes->get('poi/users', 'Poi::users');
$routes->get('poi/(:alphanum)', 'Poi::show/$1');
$routes->options('poi', 'Poi');
$routes->options('poi/(:alphanum)', 'Poi');
