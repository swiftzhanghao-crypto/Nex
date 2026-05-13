package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/scrypt"
)

const scryptKeyLen = 64

type JwtClaims struct {
	UserID         string `json:"userId"`
	Role           string `json:"role"`
	ImpersonatedBy string `json:"impersonatedBy,omitempty"`
	jwt.RegisteredClaims
}

func jwtSecret(ctx context.Context) []byte {
	s := g.Cfg().MustGet(ctx, "jwt.secret", "wps365-dev-secret-change-in-production").String()
	return []byte(s)
}

func jwtExpiresIn(ctx context.Context) time.Duration {
	s := g.Cfg().MustGet(ctx, "jwt.expiresIn", "24h").String()
	d, err := time.ParseDuration(s)
	if err != nil {
		return 24 * time.Hour
	}
	return d
}

func SignToken(ctx context.Context, userID, role string) (string, error) {
	return SignTokenWithImpersonation(ctx, userID, role, "")
}

func SignTokenWithImpersonation(ctx context.Context, userID, role, impersonatedBy string) (string, error) {
	claims := JwtClaims{
		UserID:         userID,
		Role:           role,
		ImpersonatedBy: impersonatedBy,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(jwtExpiresIn(ctx))),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret(ctx))
}

func VerifyToken(ctx context.Context, tokenStr string) (*JwtClaims, error) {
	secret := jwtSecret(ctx)
	token, err := jwt.ParseWithClaims(tokenStr, &JwtClaims{}, func(t *jwt.Token) (interface{}, error) {
		return secret, nil
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
	expected, err := hex.DecodeString(parts[1])
	if err != nil {
		return false
	}
	derived, err := scrypt.Key([]byte(password), []byte(parts[0]), 16384, 8, 1, scryptKeyLen)
	if err != nil || len(derived) != len(expected) {
		return false
	}
	return subtle.ConstantTimeCompare(derived, expected) == 1
}
