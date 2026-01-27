package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type HelloResponse struct {
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	Framework string `json:"framework"`
}

type DataItem struct {
	ID    int     `json:"id"`
	Value float64 `json:"value"`
}

type DataResponse struct {
	Data []DataItem `json:"data"`
}

type EchoRequest struct {
	Message string `json:"message"`
}

type EchoResponse struct {
	Echo     EchoRequest `json:"echo"`
	Received string      `json:"received"`
}

func main() {
	router := gin.Default()

	router.GET("/api/hello", func(c *gin.Context) {
		response := HelloResponse{
			Message:   "Hello from Go + Gin",
			Timestamp: time.Now().Format(time.RFC3339),
			Framework: "Gin",
		}
		c.JSON(http.StatusOK, response)
	})

	router.GET("/api/data", func(c *gin.Context) {
		data := make([]DataItem, 100)
		for i := 0; i < 100; i++ {
			data[i] = DataItem{
				ID:    i + 1,
				Value: float64(i) * 1.5,
			}
		}
		c.JSON(http.StatusOK, gin.H{"data": data})
	})

	router.POST("/api/echo", func(c *gin.Context) {
		var req EchoRequest
		c.BindJSON(&req)
		response := EchoResponse{
			Echo:     req,
			Received: time.Now().Format(time.RFC3339),
		}
		c.JSON(http.StatusOK, response)
	})

	router.Run(":3000")
}
