package wps365auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"
)

// SignKSO1 为 HTTP 请求添加 KSO-1 签名头。
// signPath 为 RequestURI（含 query），如 "/v7/users/current?foo=bar"。
// 算法：HMAC-SHA256(appSecret, "KSO-1" + Method + RequestURI + ContentType + KsoDate + sha256(body))
func SignKSO1(req *http.Request, appID, appSecret string, body []byte, signPath string) {
	contentType := req.Header.Get("Content-Type")
	ksoDate := time.Now().UTC().Format(time.RFC1123)

	bodyHash := ""
	if len(body) > 0 {
		h := sha256.New()
		h.Write(body)
		bodyHash = hex.EncodeToString(h.Sum(nil))
	}

	signString := "KSO-1" + req.Method + signPath + contentType + ksoDate + bodyHash
	mac := hmac.New(sha256.New, []byte(appSecret))
	mac.Write([]byte(signString))
	signature := hex.EncodeToString(mac.Sum(nil))

	req.Header.Set("X-Kso-Date", ksoDate)
	req.Header.Set("X-Kso-Authorization", fmt.Sprintf("KSO-1 %s:%s", appID, signature))
}
