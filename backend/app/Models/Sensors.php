<?php namespace App\Models;

use CodeIgniter\Model;
use CodeIgniter\Database\ConnectionInterface;
use CodeIgniter\Validation\ValidationInterface;

class Sensors extends Model
{
    protected $table = '';

    protected $key_id   = 'item_id';
    protected $key_time = 'item_utc_date';

    protected $db;

    function __construct(ConnectionInterface &$db = null, ValidationInterface $validation = null)
    {
        parent::__construct($db, $validation);

        $this->table = getenv('database.table.weather_sensors');
    }

    function get_last()
    {
        return $this->db
            ->table($this->table)
            ->orderBy($this->key_time, 'DESC')
            ->get()
            ->getRow();
    }

    function get_last_day()
    {
        return $this->db
            ->table($this->table)
            ->orderBy($this->key_time, 'DESC')
            ->where($this->key_time . ' > DATE_SUB(NOW(), INTERVAL 24 HOUR)')
            ->get()
            ->getResult();
    }

    function add(array $data)
    {
        $meta = [
            $this->key_id   => uniqid(),
            $this->key_time => gmdate('Y-m-d H:i:s')
        ];

        return $this->db->table($this->table)->insert(array_merge($meta, $data));
    }
}