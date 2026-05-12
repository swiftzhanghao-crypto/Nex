package wps365auth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type Client struct {
	Config     Config
	HTTPClient *http.Client
}

type Option func(*Client)

func WithHTTPClient(hc *http.Client) Option {
	return func(c *Client) { c.HTTPClient = hc }
}

func New(cfg Config, opts ...Option) *Client {
	cfg.defaults()
	c := &Client{
		Config:     cfg,
		HTTPClient: &http.Client{Timeout: 15 * time.Second},
	}
	for _, o := range opts {
		o(c)
	}
	return c
}

// Do 发送业务 API 请求（自动加 Bearer；按 Config.EnableSign 决定是否加 KSO-1 签名）。
// out 为 nil 时忽略响应体。
func (c *Client) Do(ctx context.Context, method, path, accessToken string, reqBody, out any) error {
	var bodyBytes []byte
	if reqBody != nil {
		b, err := json.Marshal(reqBody)
		if err != nil {
			return fmt.Errorf("wps365auth: marshal request: %w", err)
		}
		bodyBytes = b
	}

	fullURL := c.Config.url(path)
	req, err := http.NewRequestWithContext(ctx, method, fullURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return fmt.Errorf("wps365auth: create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	if c.Config.EnableSign {
		SignKSO1(req, c.Config.AppID, c.Config.AppSecret, bodyBytes, req.URL.RequestURI())
	}
	if accessToken != "" {
		req.Header.Set("Authorization", "Bearer "+accessToken)
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("wps365auth: http request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("wps365auth: read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		log.Printf("[WPS API] %s %s → %d, body=%s", method, path, resp.StatusCode, string(respBody))
		var apiErr APIError
		apiErr.HTTPStatus = resp.StatusCode
		_ = json.Unmarshal(respBody, &apiErr)
		return &apiErr
	}

	if out != nil {
		if err := json.Unmarshal(respBody, out); err != nil {
			return fmt.Errorf("wps365auth: unmarshal response: %w", err)
		}
	}
	return nil
}
