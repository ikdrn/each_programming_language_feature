/**
 * Go + Gin フレームワーク層
 * REST APIエンドポイント実装
 */

package main

import (
	"net/http"
	"strconv"

	"../db"
	"github.com/gin-gonic/gin"
)

var pgDB *db.PostgresCRUD

func init() {
	pgDB = db.NewPostgresCRUD()
}

func main() {
	router := gin.Default()

	// =============================================
	// PostgreSQL エンドポイント
	// =============================================

	// INSERT
	router.POST("/postgres/insert", func(c *gin.Context) {
		var req map[string]interface{}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		record, err := pgDB.Insert(
			req["name"].(string),
			req["email"].(string),
			int(req["age"].(float64)),
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success":     false,
				"message":     "INSERT失敗",
				"error":       err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":       true,
			"message":       "PostgreSQL - INSERT成功",
			"data":          record,
			"performance":   pgDB.GetPerformanceReport(),
		})
	})

	// SELECT
	router.GET("/postgres/select/:id", func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		record := pgDB.Select(id)

		c.JSON(http.StatusOK, gin.H{
			"success":       true,
			"message":       "PostgreSQL - SELECT成功",
			"data":          record,
			"performance":   pgDB.GetPerformanceReport(),
		})
	})

	// SELECT ALL
	router.GET("/postgres/selectall", func(c *gin.Context) {
		records := pgDB.SelectAll()

		c.JSON(http.StatusOK, gin.H{
			"success":       true,
			"message":       "PostgreSQL - SELECT ALL成功",
			"count":         len(records),
			"data":          records,
			"performance":   pgDB.GetPerformanceReport(),
		})
	})

	// UPDATE
	router.PUT("/postgres/update/:id", func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		var req map[string]interface{}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		record, err := pgDB.Update(
			id,
			req["name"].(string),
			req["email"].(string),
			int(req["age"].(float64)),
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success":     false,
				"message":     "UPDATE失敗",
				"error":       err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":       true,
			"message":       "PostgreSQL - UPDATE成功",
			"data":          record,
			"performance":   pgDB.GetPerformanceReport(),
			"transactions":  pgDB.GetTransactionReport(),
		})
	})

	// DELETE
	router.DELETE("/postgres/delete/:id", func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		err = pgDB.Delete(id)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success":     false,
				"message":     "DELETE失敗",
				"error":       err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":       true,
			"message":       "PostgreSQL - DELETE成功",
			"deleted":       true,
			"performance":   pgDB.GetPerformanceReport(),
			"transactions":  pgDB.GetTransactionReport(),
		})
	})

	// BATCH INSERT
	router.POST("/postgres/batch-insert", func(c *gin.Context) {
		var req map[string]interface{}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		records, err := pgDB.BatchInsert(req["records"].([]map[string]interface{}))

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success":     false,
				"message":     "BATCH INSERT失敗",
				"error":       err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":       true,
			"message":       "PostgreSQL - BATCH INSERT成功",
			"count":         len(records),
			"data":          records,
			"performance":   pgDB.GetPerformanceReport(),
			"transactions":  pgDB.GetTransactionReport(),
		})
	})

	// =============================================
	// ヘルスチェック
	// =============================================
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Go + Gin API Server",
			"status":  "OK",
		})
	})

	router.Run(":3002")
}
