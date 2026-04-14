package handler

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"strconv"
	"time"
)

func safeJSON(s sql.NullString, fallback string) string {
	if !s.Valid || s.String == "" {
		return fallback
	}
	return s.String
}

func parseJSON(s string) interface{} {
	var v interface{}
	if err := json.Unmarshal([]byte(s), &v); err != nil {
		return nil
	}
	return v
}

func parseJSONArray(s string) []interface{} {
	var v []interface{}
	if err := json.Unmarshal([]byte(s), &v); err != nil {
		return []interface{}{}
	}
	return v
}

func parseJSONMap(s string) map[string]interface{} {
	var v map[string]interface{}
	if err := json.Unmarshal([]byte(s), &v); err != nil {
		return map[string]interface{}{}
	}
	return v
}

func toJSON(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}

func nullStr(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}

func nullFloat(f *float64) sql.NullFloat64 {
	if f == nil {
		return sql.NullFloat64{}
	}
	return sql.NullFloat64{Float64: *f, Valid: true}
}

func safePagination(pageStr, sizeStr string) (limit, offset, pageNum int) {
	pageNum, _ = strconv.Atoi(pageStr)
	if pageNum < 1 {
		pageNum = 1
	}
	limit, _ = strconv.Atoi(sizeStr)
	if limit < 1 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	offset = (pageNum - 1) * limit
	return
}

func getUserName(db *sql.DB, userID string) string {
	var name string
	db.QueryRow("SELECT name FROM users WHERE id = ?", userID).Scan(&name)
	return name
}

func writeAuditLog(db *sql.DB, userID, userName, action, resource, resourceID, detail string) {
	db.Exec("INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)",
		userID, userName, action, resource, resourceID, detail)
}

func generateID(prefix string) string {
	return fmt.Sprintf("%s-%d-%s", prefix, time.Now().UnixMilli(), randomStr(4))
}

func randomStr(n int) string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}

func getStr(m map[string]interface{}, key string) string {
	v, ok := m[key]
	if !ok || v == nil {
		return ""
	}
	s, _ := v.(string)
	return s
}

func getFloat(m map[string]interface{}, key string) float64 {
	v, ok := m[key]
	if !ok || v == nil {
		return 0
	}
	f, _ := v.(float64)
	return f
}

func getBool(m map[string]interface{}, key string) bool {
	v, ok := m[key]
	if !ok || v == nil {
		return false
	}
	b, _ := v.(bool)
	return b
}

func getInt(m map[string]interface{}, key string) int {
	v, ok := m[key]
	if !ok || v == nil {
		return 0
	}
	f, _ := v.(float64)
	return int(math.Round(f))
}

func getArr(m map[string]interface{}, key string) []interface{} {
	v, ok := m[key]
	if !ok || v == nil {
		return []interface{}{}
	}
	a, _ := v.([]interface{})
	if a == nil {
		return []interface{}{}
	}
	return a
}

func getMap(m map[string]interface{}, key string) map[string]interface{} {
	v, ok := m[key]
	if !ok || v == nil {
		return map[string]interface{}{}
	}
	mp, _ := v.(map[string]interface{})
	if mp == nil {
		return map[string]interface{}{}
	}
	return mp
}
