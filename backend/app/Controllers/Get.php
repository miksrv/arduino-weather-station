<?php namespace App\Controllers;

class Get extends BaseController
{

    public function data()
    {

        echo '111';

        $db = \Config\Database::connect();


        $db->table('meteo_data')->insert(array(
            'item_id' => '1',
            'item_device' => '2',
            'item_ip' => '3',
            'item_query' => '4',
            'item_data_values' => '5',
            'item_timestamp' => '6'
        ));

        //$result = $db->table('meteo_data')->get();

//        echo '<pre>';
//        var_dump($result);
//        echo '</pre>';

        exit();
    }

	//--------------------------------------------------------------------

}
