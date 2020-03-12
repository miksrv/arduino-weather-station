<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Dashboard extends CI_Model
{

    const DB_DATA = 'data';

    /**
     * Return array of last data
     * @param int $limit count element in array
     * @return mixed
     */
    function get_last($limit = 1)
    {
        return $this->db
            ->select('*')
            ->order_by('datestamp', 'DESC')
            ->limit($limit)
            ->get(self::DB_DATA)->result();
    }
}