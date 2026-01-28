<?php
/**
 * PHP Laravel - データベースレイヤー
 */

class Database {
    private $db;
    private $operations = [];

    public function __construct($dbPath) {
        $this->db = new PDO("sqlite:$dbPath");
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->createTable();
    }

    private function createTable() {
        $sql = <<<SQL
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                age INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        SQL;
        $this->db->exec($sql);
    }

    public function createUser($name, $email, $age) {
        $start = microtime(true);
        $stmt = $this->db->prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)');
        $stmt->execute([$name, $email, $age]);
        $id = $this->db->lastInsertId();
        $duration = (microtime(true) - $start) * 1000;
        $this->recordOperation('CREATE', $duration);
        return [
            'id' => (int)$id,
            'name' => $name,
            'email' => $email,
            'age' => (int)$age
        ];
    }

    public function getUser($userId) {
        $start = microtime(true);
        $stmt = $this->db->prepare('SELECT id, name, email, age, created_at, updated_at FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $duration = (microtime(true) - $start) * 1000;
        $this->recordOperation('READ', $duration);
        if ($row === false) {
            return null;
        }
        return $row;
    }

    public function getAllUsers() {
        $start = microtime(true);
        $stmt = $this->db->query('SELECT id, name, email, age, created_at, updated_at FROM users');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $duration = (microtime(true) - $start) * 1000;
        $this->recordOperation('READ_ALL', $duration);
        return $rows;
    }

    public function updateUser($userId, $name, $email, $age) {
        $start = microtime(true);
        $stmt = $this->db->prepare('UPDATE users SET name = ?, email = ?, age = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $result = $stmt->execute([$name, $email, $age, $userId]);
        $duration = (microtime(true) - $start) * 1000;
        $this->recordOperation('UPDATE', $duration);
        return $stmt->rowCount() > 0;
    }

    public function deleteUser($userId) {
        $start = microtime(true);
        $stmt = $this->db->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $duration = (microtime(true) - $start) * 1000;
        $this->recordOperation('DELETE', $duration);
        return $stmt->rowCount() > 0;
    }

    public function benchmark($count = 1000) {
        $start = microtime(true);
        try {
            $this->db->beginTransaction();
            $stmt = $this->db->prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)');
            for ($i = 0; $i < $count; $i++) {
                $stmt->execute(["User$i", "user$i@example.com", 20 + ($i % 50)]);
            }
            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
        $duration = (microtime(true) - $start) * 1000;
        $this->recordOperation('BENCHMARK', $duration);
        $rps = $count / ($duration / 1000);
        return [
            'count' => $count,
            'durationMs' => number_format($duration, 3),
            'rps' => number_format($rps, 2)
        ];
    }

    private function recordOperation($type, $duration) {
        $this->operations[] = [
            'type' => $type,
            'duration' => $duration,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }

    public function getPerformanceReport() {
        $report = [];
        foreach ($this->operations as $op) {
            $type = $op['type'];
            $duration = $op['duration'];
            if (!isset($report[$type])) {
                $report[$type] = [
                    'count' => 0,
                    'totalMs' => 0.0,
                    'minMs' => PHP_FLOAT_MAX,
                    'maxMs' => 0.0
                ];
            }
            $report[$type]['count']++;
            $report[$type]['totalMs'] += $duration;
            $report[$type]['minMs'] = min($report[$type]['minMs'], $duration);
            $report[$type]['maxMs'] = max($report[$type]['maxMs'], $duration);
        }

        foreach ($report as $key => $stats) {
            $count = $stats['count'];
            $total = $stats['totalMs'];
            $report[$key]['avgMs'] = number_format($total / $count, 3);
        }

        return $report;
    }

    public function close() {
        $this->db = null;
    }
}
?>
