package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"unicode/utf8"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

type Controller struct{}

func New() *Controller { return &Controller{} }

func geminiAPIKey(ctx context.Context) string {
	v, err := g.Cfg().Get(ctx, "ai.geminiApiKey")
	if err != nil || v.IsNil() {
		return ""
	}
	return strings.TrimSpace(v.String())
}

func defaultModel(ctx context.Context) string {
	v, err := g.Cfg().Get(ctx, "ai.defaultModel")
	if err != nil || v.IsNil() || strings.TrimSpace(v.String()) == "" {
		return "gemini-2.5-flash"
	}
	return strings.TrimSpace(v.String())
}

func geminiGenerateURL(model, apiKey string) string {
	return fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
		url.PathEscape(model),
		url.QueryEscape(apiKey),
	)
}

func callGemini(ctx context.Context, model, apiKey string, payload map[string]interface{}) (string, int, string, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return "", 0, "", err
	}
	u := geminiGenerateURL(model, apiKey)
	client := g.Client()
	client.SetHeader("Content-Type", "application/json")
	res, err := client.Post(ctx, u, string(body))
	if err != nil {
		return "", 0, "", err
	}
	defer res.Close()
	respBody := strings.TrimSpace(string(res.ReadAll()))
	if res.StatusCode != http.StatusOK {
		return "", res.StatusCode, respBody, fmt.Errorf("gemini http %d", res.StatusCode)
	}
	text := gjson.New(respBody).Get("candidates.0.content.parts.0.text").String()
	if text == "" {
		return "", res.StatusCode, respBody, fmt.Errorf("empty gemini text")
	}
	return text, res.StatusCode, respBody, nil
}

func (c *Controller) Status(r *ghttp.Request) {
	ctx := r.Context()
	key := geminiAPIKey(ctx)
	r.Response.WriteJsonExit(g.Map{
		"configured": key != "",
	})
}

func (c *Controller) Generate(r *ghttp.Request) {
	ctx := r.Context()
	var req struct {
		Prompt string `json:"prompt"`
		Model  string `json:"model"`
	}
	if err := r.Parse(&req); err != nil {
		r.Response.Status = http.StatusBadRequest
		r.Response.WriteJsonExit(g.Map{"error": err.Error()})
		return
	}
	if strings.TrimSpace(req.Prompt) == "" {
		r.Response.Status = http.StatusBadRequest
		r.Response.WriteJsonExit(g.Map{"error": "prompt 不能为空"})
		return
	}
	if utf8.RuneCountInString(req.Prompt) > 20000 {
		r.Response.Status = http.StatusBadRequest
		r.Response.WriteJsonExit(g.Map{"error": "prompt 超过 20000 字符"})
		return
	}
	apiKey := geminiAPIKey(ctx)
	if apiKey == "" {
		r.Response.Status = http.StatusServiceUnavailable
		r.Response.WriteJsonExit(g.Map{"error": "AI 未配置"})
		return
	}
	model := strings.TrimSpace(req.Model)
	if model == "" {
		model = defaultModel(ctx)
	}
	payload := map[string]interface{}{
		"contents": []interface{}{
			map[string]interface{}{
				"parts": []interface{}{
					map[string]interface{}{"text": req.Prompt},
				},
			},
		},
	}
	text, _, _, err := callGemini(ctx, model, apiKey, payload)
	if err != nil {
		r.Response.Status = http.StatusBadGateway
		r.Response.WriteJsonExit(g.Map{"error": err.Error()})
		return
	}
	r.Response.WriteJsonExit(g.Map{"text": text})
}

func (c *Controller) GenerateJSON(r *ghttp.Request) {
	ctx := r.Context()
	var req struct {
		Prompt string          `json:"prompt"`
		Schema json.RawMessage `json:"schema"`
		Model  string          `json:"model"`
	}
	if err := r.Parse(&req); err != nil {
		r.Response.Status = http.StatusBadRequest
		r.Response.WriteJsonExit(g.Map{"error": err.Error()})
		return
	}
	if strings.TrimSpace(req.Prompt) == "" {
		r.Response.Status = http.StatusBadRequest
		r.Response.WriteJsonExit(g.Map{"error": "prompt 不能为空"})
		return
	}
	if utf8.RuneCountInString(req.Prompt) > 20000 {
		r.Response.Status = http.StatusBadRequest
		r.Response.WriteJsonExit(g.Map{"error": "prompt 超过 20000 字符"})
		return
	}
	if len(req.Schema) == 0 || strings.TrimSpace(string(req.Schema)) == "" {
		r.Response.Status = http.StatusBadRequest
		r.Response.WriteJsonExit(g.Map{"error": "schema 必填"})
		return
	}
	var schemaObj interface{}
	if err := json.Unmarshal(req.Schema, &schemaObj); err != nil {
		r.Response.Status = http.StatusBadRequest
		r.Response.WriteJsonExit(g.Map{"error": "schema 不是合法 JSON"})
		return
	}
	apiKey := geminiAPIKey(ctx)
	if apiKey == "" {
		r.Response.Status = http.StatusServiceUnavailable
		r.Response.WriteJsonExit(g.Map{"error": "AI 未配置"})
		return
	}
	model := strings.TrimSpace(req.Model)
	if model == "" {
		model = defaultModel(ctx)
	}
	payload := map[string]interface{}{
		"contents": []interface{}{
			map[string]interface{}{
				"parts": []interface{}{
					map[string]interface{}{"text": req.Prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"responseMimeType": "application/json",
			"responseSchema":   schemaObj,
		},
	}
	text, _, _, err := callGemini(ctx, model, apiKey, payload)
	if err != nil {
		r.Response.Status = http.StatusBadGateway
		r.Response.WriteJsonExit(g.Map{"error": err.Error()})
		return
	}
	var parsed interface{}
	_ = json.Unmarshal([]byte(text), &parsed)
	r.Response.WriteJsonExit(g.Map{
		"text": text,
		"json": parsed,
	})
}

func (c *Controller) CategorySuggest(r *ghttp.Request) {
	ctx := r.Context()
	var req struct {
		ProductName string `json:"productName"`
	}
	if err := r.Parse(&req); err != nil {
		r.Response.Status = http.StatusBadRequest
		r.Response.WriteJsonExit(g.Map{"error": err.Error()})
		return
	}
	name := strings.TrimSpace(req.ProductName)
	if name == "" {
		r.Response.Status = http.StatusBadRequest
		r.Response.WriteJsonExit(g.Map{"error": "productName 不能为空"})
		return
	}
	apiKey := geminiAPIKey(ctx)
	if apiKey == "" {
		r.Response.Status = http.StatusServiceUnavailable
		r.Response.WriteJsonExit(g.Map{"error": "AI 未配置"})
		return
	}
	model := defaultModel(ctx)
	prompt := fmt.Sprintf(
		"你是商品分类助手。请根据以下商品名称，推断最合适的一个中文品类名称（简短名词，不要解释）。商品名称：%s",
		name,
	)
	schemaObj := map[string]interface{}{
		"type": "OBJECT",
		"properties": map[string]interface{}{
			"category": map[string]interface{}{
				"type": "STRING",
			},
		},
	}
	payload := map[string]interface{}{
		"contents": []interface{}{
			map[string]interface{}{
				"parts": []interface{}{
					map[string]interface{}{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"responseMimeType": "application/json",
			"responseSchema":   schemaObj,
		},
	}
	text, _, _, err := callGemini(ctx, model, apiKey, payload)
	category := "通用"
	if err == nil {
		var wrap struct {
			Category string `json:"category"`
		}
		if json.Unmarshal([]byte(text), &wrap) == nil && strings.TrimSpace(wrap.Category) != "" {
			category = strings.TrimSpace(wrap.Category)
		}
	} else {
		r.Response.Status = http.StatusBadGateway
		r.Response.WriteJsonExit(g.Map{"error": err.Error()})
		return
	}
	r.Response.WriteJsonExit(g.Map{"category": category})
}
