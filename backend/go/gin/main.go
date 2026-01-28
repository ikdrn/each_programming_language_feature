package main

import (
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"
)

var ginDb *GinDatabase

func main() {
	var err error
	ginDb, err = NewGinDatabase(":memory:")
	if err != nil {
		panic(err)
	}
	defer ginDb.Close()

	router := gin.Default()

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Go Gin API", "status": "OK"})
	})

	router.POST("/users", func(c *gin.Context) {
		var req struct {
			Name  string `json:"name"`
			Email string `json:"email"`
			Age   int    `json:"age"`
		}
		c.BindJSON(&req)
		user, err := ginDb.CreateUser(req.Name, req.Email, req.Age)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(201, gin.H{"success": true, "data": user, "performance": ginDb.GetPerformanceReport()})
	})

	router.GET("/users", func(c *gin.Context) {
		users, err := ginDb.GetAllUsers()
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"success": true, "count": len(users), "data": users, "performance": ginDb.GetPerformanceReport()})
	})

	router.GET("/users/:id", func(c *gin.Context) {
		id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
		user, err := ginDb.GetUser(id)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"success": user != nil, "data": user, "performance": ginDb.GetPerformanceReport()})
	})

	router.PUT("/users/:id", func(c *gin.Context) {
		id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
		var req struct {
			Name  string `json:"name"`
			Email string `json:"email"`
			Age   int    `json:"age"`
		}
		c.BindJSON(&req)
		updated, err := ginDb.UpdateUser(id, req.Name, req.Email, req.Age)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"success": updated, "performance": ginDb.GetPerformanceReport()})
	})

	router.DELETE("/users/:id", func(c *gin.Context) {
		id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
		deleted, err := ginDb.DeleteUser(id)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"success": deleted, "performance": ginDb.GetPerformanceReport()})
	})

	router.POST("/benchmark", func(c *gin.Context) {
		var req struct {
			Count int `json:"count"`
		}
		c.BindJSON(&req)
		if req.Count == 0 {
			req.Count = 1000
		}
		result, err := ginDb.Benchmark(req.Count)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"success": true, "benchmark": result, "performance": ginDb.GetPerformanceReport()})
	})

	fmt.Println("Go Gin サーバーが起動しました")
	fmt.Println("リッスンポート: :4002")
	router.Run(":4002")
}
