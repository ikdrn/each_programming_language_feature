package db

import (
	"fmt"
	"sync"
	"time"
)

/**
 * Go + PostgreSQL DB層
 * トランザクション処理とパフォーマンス計測を含むCRUD操作
 */

// PerformanceTimer - パフォーマンス計測
type PerformanceTimer struct {
	Name      string
	StartTime time.Time
	EndTime   time.Time
}

// NewPerformanceTimer - タイマーを作成
func NewPerformanceTimer(name string) *PerformanceTimer {
	return &PerformanceTimer{Name: name}
}

// Start - 計測開始
func (t *PerformanceTimer) Start() {
	t.StartTime = time.Now()
}

// Stop - 計測停止
func (t *PerformanceTimer) Stop() {
	t.EndTime = time.Now()
}

// GetDurationMs - ミリ秒で期間を返す
func (t *PerformanceTimer) GetDurationMs() float64 {
	return float64(t.EndTime.Sub(t.StartTime).Nanoseconds()) / 1_000_000
}

// GetDurationFormatted - フォーマット済み期間
func (t *PerformanceTimer) GetDurationFormatted() string {
	return fmt.Sprintf("%.3fms", t.GetDurationMs())
}

// PostgresRecord - PostgreSQL レコード
type PostgresRecord struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Age       int       `json:"age"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Operation - 操作ログ
type Operation struct {
	Type      string
	Duration  float64
	Timestamp time.Time
}

// TransactionLog - トランザクションログ
type TransactionLog struct {
	ID       int64
	Status   string
	Duration float64
}

// PostgresCRUD - PostgreSQL CRUD操作クラス
type PostgresCRUD struct {
	data         []PostgresRecord
	nextID       int
	operations   []Operation
	transactions []TransactionLog
	mu           sync.RWMutex
	txCounter    int64
}

// NewPostgresCRUD - 新しいインスタンスを作成
func NewPostgresCRUD() *PostgresCRUD {
	return &PostgresCRUD{
		data:         make([]PostgresRecord, 0),
		nextID:       1,
		operations:   make([]Operation, 0),
		transactions: make([]TransactionLog, 0),
	}
}

// Transaction - トランザクション処理
func (p *PostgresCRUD) Transaction(callback func() error) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.txCounter++
	txID := p.txCounter
	timer := NewPerformanceTimer("TRANSACTION")
	timer.Start()

	fmt.Printf("[PostgreSQL] トランザクション開始: %d\n", txID)

	err := callback()

	timer.Stop()

	if err != nil {
		fmt.Printf("[PostgreSQL] トランザクションロールバック: %d - %v\n", txID, err)
		p.transactions = append(p.transactions, TransactionLog{
			ID:       txID,
			Status:   "ROLLBACK",
			Duration: timer.GetDurationMs(),
		})
		return err
	}

	fmt.Printf("[PostgreSQL] トランザクションコミット: %d\n", txID)
	p.transactions = append(p.transactions, TransactionLog{
		ID:       txID,
		Status:   "COMMIT",
		Duration: timer.GetDurationMs(),
	})

	return nil
}

// Insert - INSERT処理
func (p *PostgresCRUD) Insert(name, email string, age int) (*PostgresRecord, error) {
	var result *PostgresRecord

	err := p.Transaction(func() error {
		timer := NewPerformanceTimer("INSERT")
		timer.Start()

		record := PostgresRecord{
			ID:        p.nextID,
			Name:      name,
			Email:     email,
			Age:       age,
			CreatedAt: time.Now(),
		}

		p.data = append(p.data, record)
		p.nextID++

		timer.Stop()
		p.operations = append(p.operations, Operation{
			Type:      "INSERT",
			Duration:  timer.GetDurationMs(),
			Timestamp: time.Now(),
		})

		fmt.Printf("[PostgreSQL] INSERT完了 - ID: %d, 所要時間: %s\n", record.ID, timer.GetDurationFormatted())
		result = &record

		return nil
	})

	return result, err
}

// Select - SELECT処理（1件）
func (p *PostgresCRUD) Select(id int) *PostgresRecord {
	p.mu.RLock()
	defer p.mu.RUnlock()

	timer := NewPerformanceTimer("SELECT")
	timer.Start()

	var result *PostgresRecord
	for i := range p.data {
		if p.data[i].ID == id {
			result = &p.data[i]
			break
		}
	}

	timer.Stop()
	p.operations = append(p.operations, Operation{
		Type:      "SELECT",
		Duration:  timer.GetDurationMs(),
		Timestamp: time.Now(),
	})

	if result != nil {
		fmt.Printf("[PostgreSQL] SELECT完了 - ID: %d, 所要時間: %s\n", id, timer.GetDurationFormatted())
	}

	return result
}

// SelectAll - SELECT ALL処理
func (p *PostgresCRUD) SelectAll() []PostgresRecord {
	p.mu.RLock()
	defer p.mu.RUnlock()

	timer := NewPerformanceTimer("SELECT_ALL")
	timer.Start()

	result := make([]PostgresRecord, len(p.data))
	copy(result, p.data)

	timer.Stop()
	p.operations = append(p.operations, Operation{
		Type:      "SELECT_ALL",
		Duration:  timer.GetDurationMs(),
		Timestamp: time.Now(),
	})

	fmt.Printf("[PostgreSQL] SELECT_ALL完了 - 件数: %d, 所要時間: %s\n", len(result), timer.GetDurationFormatted())

	return result
}

// Update - UPDATE処理
func (p *PostgresCRUD) Update(id int, name, email string, age int) (*PostgresRecord, error) {
	var result *PostgresRecord

	err := p.Transaction(func() error {
		timer := NewPerformanceTimer("UPDATE")
		timer.Start()

		for i := range p.data {
			if p.data[i].ID == id {
				p.data[i].Name = name
				p.data[i].Email = email
				p.data[i].Age = age
				p.data[i].UpdatedAt = time.Now()
				result = &p.data[i]

				timer.Stop()
				p.operations = append(p.operations, Operation{
					Type:      "UPDATE",
					Duration:  timer.GetDurationMs(),
					Timestamp: time.Now(),
				})

				fmt.Printf("[PostgreSQL] UPDATE完了 - ID: %d, 所要時間: %s\n", id, timer.GetDurationFormatted())
				return nil
			}
		}

		timer.Stop()
		return fmt.Errorf("レコードが見つかりません: ID=%d", id)
	})

	return result, err
}

// Delete - DELETE処理
func (p *PostgresCRUD) Delete(id int) error {
	return p.Transaction(func() error {
		timer := NewPerformanceTimer("DELETE")
		timer.Start()

		for i := range p.data {
			if p.data[i].ID == id {
				p.data = append(p.data[:i], p.data[i+1:]...)

				timer.Stop()
				p.operations = append(p.operations, Operation{
					Type:      "DELETE",
					Duration:  timer.GetDurationMs(),
					Timestamp: time.Now(),
				})

				fmt.Printf("[PostgreSQL] DELETE完了 - ID: %d, 所要時間: %s\n", id, timer.GetDurationFormatted())
				return nil
			}
		}

		timer.Stop()
		return fmt.Errorf("レコードが見つかりません: ID=%d", id)
	})
}

// BatchInsert - バッチ挿入処理
func (p *PostgresCRUD) BatchInsert(records []map[string]interface{}) ([]PostgresRecord, error) {
	var results []PostgresRecord

	err := p.Transaction(func() error {
		timer := NewPerformanceTimer("BATCH_INSERT")
		timer.Start()

		for _, rec := range records {
			record := PostgresRecord{
				ID:        p.nextID,
				Name:      rec["name"].(string),
				Email:     rec["email"].(string),
				Age:       rec["age"].(int),
				CreatedAt: time.Now(),
			}

			p.data = append(p.data, record)
			results = append(results, record)
			p.nextID++
		}

		timer.Stop()
		p.operations = append(p.operations, Operation{
			Type:      "BATCH_INSERT",
			Duration:  timer.GetDurationMs(),
			Timestamp: time.Now(),
		})

		fmt.Printf("[PostgreSQL] BATCH_INSERT完了 - 件数: %d, 所要時間: %s\n", len(records), timer.GetDurationFormatted())
		return nil
	})

	return results, err
}

// GetPerformanceReport - パフォーマンスレポート
func (p *PostgresCRUD) GetPerformanceReport() map[string]map[string]interface{} {
	p.mu.RLock()
	defer p.mu.RUnlock()

	report := make(map[string]map[string]interface{})

	for _, op := range p.operations {
		if _, exists := report[op.Type]; !exists {
			report[op.Type] = map[string]interface{}{
				"count":   0,
				"totalMs": 0.0,
				"minMs":   float64(1e9),
				"maxMs":   0.0,
			}
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
		totalMs := stats["totalMs"].(float64)
		stats["avgMs"] = totalMs / float64(count)
	}

	return report
}

// GetTransactionReport - トランザクションレポート
func (p *PostgresCRUD) GetTransactionReport() map[string]interface{} {
	p.mu.RLock()
	defer p.mu.RUnlock()

	committed := 0
	rolledback := 0

	for _, tx := range p.transactions {
		if tx.Status == "COMMIT" {
			committed++
		} else if tx.Status == "ROLLBACK" {
			rolledback++
		}
	}

	return map[string]interface{}{
		"totalTransactions":      len(p.transactions),
		"committedTransactions":  committed,
		"rolledBackTransactions": rolledback,
		"transactions":           p.transactions,
	}
}
