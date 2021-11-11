<?php namespace App\Models;

use CodeIgniter\Model;
use CodeIgniter\Database\ConnectionInterface;
use CodeIgniter\Validation\ValidationInterface;

class Forecast extends Model
{
    protected $table = '';

    protected $key_id   = 'item_id';
    protected $key_time = 'item_utc_date';

    protected $db;

    function __construct(ConnectionInterface &$db = null, ValidationInterface $validation = null)
    {
        parent::__construct($db, $validation);

        $this->table = getenv('database.table.weather_forecast');
    }

    function get_last()
    {
        return $this->db->table($this->table)
            ->orderBy($this->key_time, 'ASC')
            ->getWhere([$this->key_time . '>' => gmdate('Y-m-d H:i:s')], 10)
            ->getResult();
    }

    function refresh(array $data, int $time)
    {
        if ($this->find_by_time($time)) {
            return $this->db->table($this->table)
                ->where($this->key_time, gmdate('Y-m-d H:i:s', $time))
                ->update($data);
        }

        return $this->add($data, $time);
    }

    function find_by_time(int $time)
    {
        return $this->db->table($this->table)
            ->getWhere([$this->key_time => gmdate('Y-m-d H:i:s', $time)])
            ->getRow();
    }

    function add(array $data, int $time)
    {
        $meta = [
            $this->key_id   => uniqid(),
            $this->key_time => gmdate('Y-m-d H:i:s', $time)
        ];

        return $this->db->table($this->table)->insert(array_merge($meta, $data));
    }
}