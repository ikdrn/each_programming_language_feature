package main

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type GinDatabase struct {
	db         *sql.DB
	operations []Operation
}

type Operation struct {
	Type      string
	Duration  float64
	Timestamp time.Time
}

func NewGinDatabase(dbPath string) (*GinDatabase, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	createSQL := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		email TEXT UNIQUE NOT NULL,
		age INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)
	`

	if _, err := db.Exec(createSQL); err != nil {
		return nil, err
	}

	return &GinDatabase{db: db, operations: make([]Operation, 0)}, nil
}

func (d *GinDatabase) CreateUser(name, email string, age int) (map[string]interface{}, error) {
	start := time.Now()
	result, err := d.db.Exec("INSERT INTO users (name, email, age) VALUES (?, ?, ?)", name, email, age)
	if err != nil {
		return nil, err
	}
	id, _ := result.LastInsertId()
	duration := time.Since(start).Seconds() * 1000
	d.recordOperation("CREATE", duration)
	return map[string]interface{}{"id": id, "name": name, "email": email, "age": age}, nil
}

func (d *GinDatabase) GetUser(id int64) (map[string]interface{}, error) {
	start := time.Now()
	var name, email, createdAt, updatedAt string
	var age int
	err := d.db.QueryRow("SELECT id, name, email, age, created_at, updated_at FROM users WHERE id = ?", id).Scan(&id, &name, &email, &age, &createdAt, &updatedAt)
	duration := time.Since(start).Seconds() * 1000
	d.recordOperation("READ", duration)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{"id": id, "name": name, "email": email, "age": age, "created_at": createdAt, "updated_at": updatedAt}, nil
}

func (d *GinDatabase) GetAllUsers() ([]map[string]interface{}, error) {
	start := time.Now()
	rows, err := d.db.Query("SELECT id, name, email, age, created_at, updated_at FROM users")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	users := make([]map[string]interface{}, 0)
	for rows.Next() {
		var id int64
		var name, email, createdAt, updatedAt string
		var age int
		if err := rows.Scan(&id, &name, &email, &age, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		users = append(users, map[string]interface{}{"id": id, "name": name, "email": email, "age": age, "created_at": createdAt, "updated_at": updatedAt})
	}
	duration := time.Since(start).Seconds() * 1000
	d.recordOperation("READ_ALL", duration)
	return users, nil
}

func (d *GinDatabase) UpdateUser(id int64, name, email string, age int) (bool, error) {
	start := time.Now()
	result, err := d.db.Exec("UPDATE users SET name = ?, email = ?, age = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", name, email, age, id)
	if err != nil {
		return false, err
	}
	rowsAffected, _ := result.RowsAffected()
	duration := time.Since(start).Seconds() * 1000
	d.recordOperation("UPDATE", duration)
	return rowsAffected > 0, nil
}

func (d *GinDatabase) DeleteUser(id int64) (bool, error) {
	start := time.Now()
	result, err := d.db.Exec("DELETE FROM users WHERE id = ?", id)
	if err != nil {
		return false, err
	}
	rowsAffected, _ := result.RowsAffected()
	duration := time.Since(start).Seconds() * 1000
	d.recordOperation("DELETE", duration)
	return rowsAffected > 0, nil
}

func (d *GinDatabase) Benchmark(count int) (map[string]interface{}, error) {
	start := time.Now()
	tx, err := d.db.Begin()
	if err != nil {
		return nil, err
	}
	stmt, err := tx.Prepare("INSERT INTO users (name, email, age) VALUES (?, ?, ?)")
	if err != nil {
		tx.Rollback()
		return nil, err
	}
	for i := 0; i < count; i++ {
		_, err := stmt.Exec(fmt.Sprintf("User%d", i), fmt.Sprintf("user%d@example.com", i), 20+(i%50))
		if err != nil {
			tx.Rollback()
			return nil, err
		}
	}
	stmt.Close()
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	duration := time.Since(start).Seconds() * 1000
	d.recordOperation("BENCHMARK", duration)
	rps := float64(count) / (duration / 1000)
	return map[string]interface{}{"count": count, "durationMs": fmt.Sprintf("%.3f", duration), "rps": fmt.Sprintf("%.2f", rps)}, nil
}

func (d *GinDatabase) recordOperation(opType string, duration float64) {
	d.operations = append(d.operations, Operation{Type: opType, Duration: duration, Timestamp: time.Now()})
}

func (d *GinDatabase) GetPerformanceReport() map[string]map[string]interface{} {
	report := make(map[string]map[string]interface{})
	for _, op := range d.operations {
		if _, exists := report[op.Type]; !exists {
			report[op.Type] = map[string]interface{}{"count": 0, "totalMs": 0.0, "minMs": float64(1e9), "maxMs": 0.0}
		}
		stats := report[op.Type]
		stats["count"] = stats["count"].(int) + 1
		stats["totalMs"] = stats["totalMs"].(float64) + op.Duration
		if op.Duration < stats["minMs"].(float64) {
			stats["minMs"] = op.Duration
		}
		if op.Duration > stats["maxMs"].(float64) {
			stats["maxMs"] = op.Duration
		}
	}
	for key := range report {
		stats := report[key]
		count := stats["count"].(int)
		total := stats["totalMs"].(float64)
		stats["avgMs"] = fmt.Sprintf("%.3f", total/float64(count))
	}
	return report
}

func (d *GinDatabase) Close() error {
	return d.db.Close()
}
