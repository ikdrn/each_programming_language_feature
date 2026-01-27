/**
 * Go + Gin API サーバー
 * ベンチマーク用の基本的なRESTful APIエンドポイントを実装
 * Ginはパフォーマンスに優れた軽量フレームワーク
 */

package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// HelloResponse はグリーティングメッセージのレスポンス
type HelloResponse struct {
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	Framework string `json:"framework"`
}

// DataItem はサンプルデータの個別アイテム
type DataItem struct {
	ID    int     `json:"id"`
	Value float64 `json:"value"`
}

// DataResponse はサンプルデータのレスポンス
type DataResponse struct {
	Data []DataItem `json:"data"`
}

// EchoRequest はエコーエンドポイントのリクエスト
type EchoRequest struct {
	Message string `json:"message"`
}

// EchoResponse はエコーエンドポイントのレスポンス
type EchoResponse struct {
	Echo     EchoRequest `json:"echo"`
	Received string      `json:"received"`
}

func main() {
	// Ginルーターを初期化
	router := gin.Default()

	// GET /api/hello - グリーティングメッセージを返す
	router.GET("/api/hello", func(c *gin.Context) {
		response := HelloResponse{
			Message:   "Hello from Go + Gin",
			Timestamp: time.Now().Format(time.RFC3339),
			Framework: "Gin",
		}
		c.JSON(http.StatusOK, response)
	})

	// GET /api/data - 100個のサンプルデータを返す
	router.GET("/api/data", func(c *gin.Context) {
		// サンプルデータを生成
		data := make([]DataItem, 100)
		for i := 0; i < 100; i++ {
			data[i] = DataItem{
				ID:    i + 1,
				Value: float64(i) * 1.5,
			}
		}
		c.JSON(http.StatusOK, gin.H{"data": data})
	})

	// POST /api/echo - リクエストボディをエコーバックする
	router.POST("/api/echo", func(c *gin.Context) {
		var req EchoRequest
		// JSONボディをバインド
		c.BindJSON(&req)
		response := EchoResponse{
			Echo:     req,
			Received: time.Now().Format(time.RFC3339),
		}
		c.JSON(http.StatusOK, response)
	})

	// ポート 3000 でサーバー起動
	router.Run(":3000")
}
