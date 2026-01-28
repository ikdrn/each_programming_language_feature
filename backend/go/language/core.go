package language

import (
	"fmt"
	"sync"
	"time"
)

/**
 * Go 言語層 - コア機能
 * 基本的なCRUD操作とパフォーマンス計測を提供
 */

// PerformanceTimer - パフォーマンス計測用の構造体
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

// GetDurationMs - ナノ秒をミリ秒に変換して返す
func (t *PerformanceTimer) GetDurationMs() float64 {
	return float64(t.EndTime.Sub(t.StartTime).Nanoseconds()) / 1_000_000
}

// GetDurationFormatted - フォーマット済みの期間を返す
func (t *PerformanceTimer) GetDurationFormatted() string {
	return fmt.Sprintf("%.3fms", t.GetDurationMs())
}

// User - ユーザーモデル
type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Age       int       `json:"age"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// CRUDBase - CRUD操作の基本インターフェース
type CRUDBase struct {
	Items       []User
	NextID      int
	Operations  []Operation
	mu          sync.RWMutex
}

// Operation - 操作ログ
type Operation struct {
	Type      string
	Duration  float64
	Timestamp time.Time
}

// NewCRUDBase - 新しいCRUDBase インスタンスを作成
func NewCRUDBase() *CRUDBase {
	return &CRUDBase{
		Items:      make([]User, 0),
		NextID:     1,
		Operations: make([]Operation, 0),
	}
}

// Create - ユーザーを作成・挿入
func (c *CRUDBase) Create(name, email string, age int) *User {
	c.mu.Lock()
	defer c.mu.Unlock()

	timer := NewPerformanceTimer("CREATE")
	timer.Start()

	user := User{
		ID:        c.NextID,
		Name:      name,
		Email:     email,
		Age:       age,
		CreatedAt: time.Now(),
	}

	c.Items = append(c.Items, user)
	c.NextID++

	timer.Stop()
	c.recordOperation("CREATE", timer.GetDurationMs())

	return &user
}

// Read - IDでユーザーを取得
func (c *CRUDBase) Read(id int) *User {
	c.mu.RLock()
	defer c.mu.RUnlock()

	timer := NewPerformanceTimer("READ")
	timer.Start()

	var result *User
	for i := range c.Items {
		if c.Items[i].ID == id {
			result = &c.Items[i]
			break
		}
	}

	timer.Stop()
	c.recordOperation("READ", timer.GetDurationMs())

	return result
}

// ReadAll - 全ユーザーを取得
func (c *CRUDBase) ReadAll() []User {
	c.mu.RLock()
	defer c.mu.RUnlock()

	timer := NewPerformanceTimer("READ_ALL")
	timer.Start()

	result := make([]User, len(c.Items))
	copy(result, c.Items)

	timer.Stop()
	c.recordOperation("READ_ALL", timer.GetDurationMs())

	return result
}

// Update - ユーザーを更新
func (c *CRUDBase) Update(id int, name, email string, age int) *User {
	c.mu.Lock()
	defer c.mu.Unlock()

	timer := NewPerformanceTimer("UPDATE")
	timer.Start()

	var result *User
	for i := range c.Items {
		if c.Items[i].ID == id {
			c.Items[i].Name = name
			c.Items[i].Email = email
			c.Items[i].Age = age
			c.Items[i].UpdatedAt = time.Now()
			result = &c.Items[i]
			break
		}
	}

	timer.Stop()
	c.recordOperation("UPDATE", timer.GetDurationMs())

	return result
}

// Delete - ユーザーを削除
func (c *CRUDBase) Delete(id int) bool {
	c.mu.Lock()
	defer c.mu.Unlock()

	timer := NewPerformanceTimer("DELETE")
	timer.Start()

	for i := range c.Items {
		if c.Items[i].ID == id {
			c.Items = append(c.Items[:i], c.Items[i+1:]...)
			timer.Stop()
			c.recordOperation("DELETE", timer.GetDurationMs())
			return true
		}
	}

	timer.Stop()
	return false
}

// recordOperation - 操作を記録
func (c *CRUDBase) recordOperation(opType string, duration float64) {
	c.Operations = append(c.Operations, Operation{
		Type:      opType,
		Duration:  duration,
		Timestamp: time.Now(),
	})
}

// GetPerformanceReport - パフォーマンスレポートを取得
func (c *CRUDBase) GetPerformanceReport() map[string]map[string]interface{} {
	c.mu.RLock()
	defer c.mu.RUnlock()

	report := make(map[string]map[string]interface{})

	for _, op := range c.Operations {
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

	// 平均を計算
	for key := range report {
		stats := report[key]
		count := stats["count"].(int)
		totalMs := stats["totalMs"].(float64)
		stats["avgMs"] = totalMs / float64(count)
	}

	return report
}
