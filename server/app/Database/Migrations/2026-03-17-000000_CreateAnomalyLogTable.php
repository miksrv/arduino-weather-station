<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration: CreateAnomalyLogTable
 *
 * Creates the anomaly_log table for storing detected meteorological anomaly events.
 *
 * @package App\Database\Migrations
 */
class CreateAnomalyLogTable extends Migration
{
    /**
     * Run the migration — create the anomaly_log table.
     */
    public function up(): void
    {
        $this->forge->addField([
            'id'          => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'type'        => ['type' => 'VARCHAR', 'constraint' => 50],
            'start_date'  => ['type' => 'DATE'],
            'end_date'    => ['type' => 'DATE',     'null' => true, 'default' => null],
            'peak_value'  => ['type' => 'FLOAT',    'null' => true, 'default' => null],
            'description' => ['type' => 'TEXT',     'null' => true, 'default' => null],
            'created_at'  => ['type' => 'DATETIME'],
            'updated_at'  => ['type' => 'DATETIME', 'null' => true, 'default' => null],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addKey('type');
        $this->forge->addKey('start_date');
        $this->forge->createTable('anomaly_log');
    }

    /**
     * Reverse the migration — drop the anomaly_log table.
     */
    public function down(): void
    {
        $this->forge->dropTable('anomaly_log');
    }
}
