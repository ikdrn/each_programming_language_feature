package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
)

/**
 * Go Vanilla - メインファイル（ルーティングのみ）
 * 標準ライブラリ net/http のみを使用
 */

var db *Database

func init() {
	var err error
	db, err = NewDatabase(":memory:")
	if err != nil {
		panic(err)
	}
}

func main() {
	port := ":4001"

	http.HandleFunc("/", handleHealth)
	http.HandleFunc("/users", handleUsers)
	http.HandleFunc("/benchmark", handleBenchmark)

	fmt.Printf("Go Vanilla サーバーが起動しました\nリッスンポート: %s\n", port)
	http.ListenAndServe(port, nil)
}

// ========== ハンドラー ==========

func handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Go Vanilla API",
		"status":  "OK",
	})
}

func handleUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	path := r.URL.Path
	method := r.Method

	// POST /users - 作成
	if method == http.MethodPost && path == "/users" {
		body, _ := io.ReadAll(r.Body)
		var req struct {
			Name  string `json:"name"`
			Email string `json:"email"`
			Age   int    `json:"age"`
		}
		json.Unmarshal(body, &req)

		user, err := db.CreateUser(req.Name, req.Email, req.Age)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":     true,
			"data":        user,
			"performance": db.GetPerformanceReport(),
		})
		return
	}

	// GET /users - 全取得
	if method == http.MethodGet && path == "/users" {
		users, err := db.GetAllUsers()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":     true,
			"count":       len(users),
			"data":        users,
			"performance": db.GetPerformanceReport(),
		})
		return
	}

	// GET /users/:id - 特定ユーザー取得
	if method == http.MethodGet && strings.HasPrefix(path, "/users/") {
		idStr := strings.TrimPrefix(path, "/users/")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid ID"})
			return
		}

		user, err := db.GetUser(id)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":     true,
			"data":        user,
			"performance": db.GetPerformanceReport(),
		})
		return
	}

	// PUT /users/:id - 更新
	if method == http.MethodPut && strings.HasPrefix(path, "/users/") {
		idStr := strings.TrimPrefix(path, "/users/")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid ID"})
			return
		}

		body, _ := io.ReadAll(r.Body)
		var req struct {
			Name  string `json:"name"`
			Email string `json:"email"`
			Age   int    `json:"age"`
		}
		json.Unmarshal(body, &req)

		updated, err := db.UpdateUser(id, req.Name, req.Email, req.Age)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":     updated,
			"performance": db.GetPerformanceReport(),
		})
		return
	}

	// DELETE /users/:id - 削除
	if method == http.MethodDelete && strings.HasPrefix(path, "/users/") {
		idStr := strings.TrimPrefix(path, "/users/")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid ID"})
			return
		}

		deleted, err := db.DeleteUser(id)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":     deleted,
			"performance": db.GetPerformanceReport(),
		})
		return
	}

	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{"error": "Not Found"})
}

func handleBenchmark(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	body, _ := io.ReadAll(r.Body)
	var req struct {
		Count int `json:"count"`
	}
	json.Unmarshal(body, &req)

	if req.Count == 0 {
		req.Count = 1000
	}

	result, err := db.Benchmark(req.Count)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":     true,
		"benchmark":   result,
		"performance": db.GetPerformanceReport(),
	})
}
