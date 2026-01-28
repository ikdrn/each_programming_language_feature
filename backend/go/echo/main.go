package main

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

var echoDb *EchoDatabase

func main() {
	var err error
	echoDb, err = NewEchoDatabase(":memory:")
	if err != nil {
		panic(err)
	}
	defer echoDb.Close()

	e := echo.New()

	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"message": "Go Echo API", "status": "OK"})
	})

	e.POST("/users", func(c echo.Context) error {
		var req struct {
			Name  string `json:"name"`
			Email string `json:"email"`
			Age   int    `json:"age"`
		}
		c.Bind(&req)
		user, err := echoDb.CreateUser(req.Name, req.Email, req.Age)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusCreated, map[string]interface{}{
			"success":     true,
			"data":        user,
			"performance": echoDb.GetPerformanceReport(),
		})
	})

	e.GET("/users", func(c echo.Context) error {
		users, err := echoDb.GetAllUsers()
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]interface{}{
			"success":     true,
			"count":       len(users),
			"data":        users,
			"performance": echoDb.GetPerformanceReport(),
		})
	})

	e.GET("/users/:id", func(c echo.Context) error {
		id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
		user, err := echoDb.GetUser(id)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]interface{}{
			"success":     user != nil,
			"data":        user,
			"performance": echoDb.GetPerformanceReport(),
		})
	})

	e.PUT("/users/:id", func(c echo.Context) error {
		id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
		var req struct {
			Name  string `json:"name"`
			Email string `json:"email"`
			Age   int    `json:"age"`
		}
		c.Bind(&req)
		updated, err := echoDb.UpdateUser(id, req.Name, req.Email, req.Age)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]interface{}{
			"success":     updated,
			"performance": echoDb.GetPerformanceReport(),
		})
	})

	e.DELETE("/users/:id", func(c echo.Context) error {
		id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
		deleted, err := echoDb.DeleteUser(id)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]interface{}{
			"success":     deleted,
			"performance": echoDb.GetPerformanceReport(),
		})
	})

	e.POST("/benchmark", func(c echo.Context) error {
		var req struct {
			Count int `json:"count"`
		}
		c.Bind(&req)
		if req.Count == 0 {
			req.Count = 1000
		}
		result, err := echoDb.Benchmark(req.Count)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]interface{}{
			"success":     true,
			"benchmark":   result,
			"performance": echoDb.GetPerformanceReport(),
		})
	})

	fmt.Println("Go Echo サーバーが起動しました")
	fmt.Println("リッスンポート: :4003")
	e.Logger.Fatal(e.Start(":4003"))
}
