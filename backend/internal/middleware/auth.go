package middleware

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/scrypt"
)

const scryptKeyLen = 64

var jwtSecret []byte

func init() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		if os.Getenv("GIN_MODE") == "release" {
			log.Fatal("[FATAL] JWT_SECRET 环境变量未设置，生产环境不允许使用默认密钥。")
		}
		secret = "wps365-dev-secret-DO-NOT-USE-IN-PROD"
	}
	jwtSecret = []byte(secret)
}

type JwtClaims struct {
	UserID string `json:"userId"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func SignToken(userID, role string) (string, error) {
	claims := JwtClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func VerifyToken(tokenStr string) (*JwtClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &JwtClaims{}, func(t *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*JwtClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}

func HashPassword(password string) string {
	salt := make([]byte, 16)
	rand.Read(salt)
	saltHex := hex.EncodeToString(salt)
	// Node.js passes the hex string as salt directly (not decoded bytes)
	derived, _ := scrypt.Key([]byte(password), []byte(saltHex), 16384, 8, 1, scryptKeyLen)
	return saltHex + ":" + hex.EncodeToString(derived)
}

func VerifyPassword(password, stored string) bool {
	if stored == "" {
		return false
	}
	if !strings.Contains(stored, ":") {
		legacy := sha256.Sum256([]byte(password))
		return stored == hex.EncodeToString(legacy[:])
	}
	parts := strings.SplitN(stored, ":", 2)
	if len(parts) != 2 {
		return false
	}
	// Node.js passes the hex string as salt directly (not decoded bytes)
	saltBytes := []byte(parts[0])
	expected, _ := hex.DecodeString(parts[1])
	derived, err := scrypt.Key([]byte(password), saltBytes, 16384, 8, 1, scryptKeyLen)
	if err != nil || len(derived) != len(expected) {
		return false
	}
	return subtle.ConstantTimeCompare(derived, expected) == 1
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "未提供认证令牌"})
			return
		}
		claims, err := VerifyToken(header[7:])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "令牌无效或已过期"})
			return
		}
		c.Set("userId", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func RequireSelfOrRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userId")
		role, _ := c.Get("role")
		targetID := c.Param("id")
		if userID == targetID {
			c.Next()
			return
		}
		roleStr, _ := role.(string)
		for _, r := range roles {
			if r == roleStr {
				c.Next()
				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "只能修改本人信息，或需要管理员权限"})
	}
}

func GetUserID(c *gin.Context) string {
	v, _ := c.Get("userId")
	s, _ := v.(string)
	return s
}

func GetUserRole(c *gin.Context) string {
	v, _ := c.Get("role")
	s, _ := v.(string)
	return s
}
