<?php namespace App\Models;

use CodeIgniter\Model;
use CodeIgniter\Database\ConnectionInterface;
use CodeIgniter\Validation\ValidationInterface;

class SensorData extends Model
{
    protected $table      = '';
    protected $primaryKey = 'item_id';
    protected $returnType = 'object';

    protected $db;

    public function __construct(ConnectionInterface &$db = null, ValidationInterface $validation = null)
    {
        parent::__construct($db, $validation);

        $this->table = getenv('database.table.data');
    }

    /**
     * Return sensor data in period
     * @return mixed
     */
    public function get_period()
    {
        $interval = '`item_timestamp` >= DATE_SUB(NOW(), INTERVAL 1 DAY)';

        return $this->db->table($this->table)
                    ->where($interval)
                    ->orderBy('item_timestamp', 'DESC')
                    ->get()
                    ->getResult();
    }
}