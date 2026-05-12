package llmexample

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

var (
	chatOnce    sync.Once
	chatModel   model.ToolCallingChatModel
	initChatErr error
)

type Service struct{}

type gatewayConfig struct {
	BaseURL      string
	ChatAPI      string
	APIKey       string
	ModelID      string
	Temperature  float32
	TopP         float32
	MaxTokens    int
	Stream       bool
	RetryCount   int
	TimeoutSec   int
	GatewayUID   string
	ProductName  string
	IntentionKey string
}

type chatCompletionRequest struct {
	Model               string                  `json:"model"`
	Messages            []chatCompletionMessage `json:"messages"`
	Stream              bool                    `json:"stream,omitempty"`
	Temperature         *float32                `json:"temperature,omitempty"`
	TopP                *float32                `json:"top_p,omitempty"`
	MaxCompletionTokens *int                    `json:"max_completion_tokens,omitempty"`
}

type chatCompletionMessage struct {
	Role    string `json:"role"`
	Content any    `json:"content"`
}

type chatCompletionResponse struct {
	Choices []chatCompletionChoice `json:"choices"`
	Error   *responseError         `json:"error"`
}

type chatCompletionChoice struct {
	Message chatCompletionMessage `json:"message"`
}

type responseError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (s *Service) Query(ctx context.Context, prompt string, data json.RawMessage, modelName string) (string, any, error) {
	if strings.TrimSpace(prompt) == "" {
		return "", nil, gerror.New("prompt 不能为空")
	}
	if len(data) == 0 {
		return "", nil, gerror.New("data 不能为空")
	}
	chat, err := GetChatModel(ctx)
	if err != nil {
		return "", nil, err
	}
	userPrompt := fmt.Sprintf("%s\n\n输入数据(JSON):\n%s\n\n请只返回 JSON 对象。", prompt, string(data))
	msgs := []*schema.Message{
		{Role: schema.System, Content: "你是一个严格输出 JSON 的助手。"},
		{Role: schema.User, Content: userPrompt},
	}
	opts := make([]model.Option, 0, 1)
	if strings.TrimSpace(modelName) != "" {
		opts = append(opts, model.WithModel(modelName))
	}
	resp, err := chat.Generate(ctx, msgs, opts...)
	if err != nil {
		return "", nil, err
	}
	content := strings.TrimSpace(resp.Content)
	return content, tryParseJSON(content), nil
}

func GetChatModel(ctx context.Context) (model.ToolCallingChatModel, error) {
	chatOnce.Do(func() {
		cfg := loadGatewayConfig(ctx)
		chatModel, initChatErr = newGatewayChatModel(cfg)
	})
	if initChatErr != nil {
		return nil, initChatErr
	}
	return chatModel, nil
}

func loadGatewayConfig(ctx context.Context) *gatewayConfig {
	cfg := g.Cfg()
	return &gatewayConfig{
		BaseURL:      cfg.MustGet(ctx, "llm.gateway.baseUrl", "https://ai-gateway.wps.cn").String(),
		ChatAPI:      cfg.MustGet(ctx, "llm.gateway.chatApi", "/api/v3/chat/completions").String(),
		APIKey:       cfg.MustGet(ctx, "llm.gateway.apiKey").String(),
		ModelID:      cfg.MustGet(ctx, "llm.gateway.modelId", "azure/gpt-4.1-mini").String(),
		Temperature:  float32(cfg.MustGet(ctx, "llm.gateway.temperature", 0.2).Float32()),
		TopP:         float32(cfg.MustGet(ctx, "llm.gateway.topP", 1.0).Float32()),
		MaxTokens:    cfg.MustGet(ctx, "llm.gateway.maxCompletionTokens", 2048).Int(),
		Stream:       cfg.MustGet(ctx, "llm.gateway.stream", false).Bool(),
		RetryCount:   cfg.MustGet(ctx, "llm.gateway.retryCount", 1).Int(),
		TimeoutSec:   cfg.MustGet(ctx, "llm.gateway.timeoutSec", 60).Int(),
		GatewayUID:   cfg.MustGet(ctx, "llm.gateway.uid").String(),
		ProductName:  cfg.MustGet(ctx, "llm.gateway.productName").String(),
		IntentionKey: cfg.MustGet(ctx, "llm.gateway.intentionCode").String(),
	}
}

func tryParseJSON(content string) any {
	content = strings.TrimSpace(content)
	if content == "" {
		return nil
	}
	var out any
	if json.Unmarshal([]byte(content), &out) == nil {
		return out
	}
	re := regexp.MustCompile("(?s)```(?:json)?\\s*(\\{.*\\}|\\[.*\\])\\s*```")
	matches := re.FindStringSubmatch(content)
	if len(matches) == 2 && json.Unmarshal([]byte(matches[1]), &out) == nil {
		return out
	}
	return nil
}

type gatewayChatModel struct {
	cfg        *gatewayConfig
	endpoint   string
	httpClient *http.Client
}

func newGatewayChatModel(cfg *gatewayConfig) (*gatewayChatModel, error) {
	if strings.TrimSpace(cfg.BaseURL) == "" || strings.TrimSpace(cfg.ChatAPI) == "" {
		return nil, gerror.New("llm.gateway.baseUrl/chatApi 不能为空")
	}
	if strings.TrimSpace(cfg.ModelID) == "" {
		return nil, gerror.New("llm.gateway.modelId 不能为空")
	}
	timeout := time.Duration(cfg.TimeoutSec) * time.Second
	if timeout <= 0 {
		timeout = 60 * time.Second
	}
	return &gatewayChatModel{
		cfg:      cfg,
		endpoint: joinURL(cfg.BaseURL, cfg.ChatAPI),
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}, nil
}

func (m *gatewayChatModel) Generate(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.Message, error) {
	options := model.GetCommonOptions(nil, opts...)
	reqBody := chatCompletionRequest{
		Model:               m.cfg.ModelID,
		Messages:            toInputMessages(input),
		Stream:              m.cfg.Stream,
		Temperature:         ptrFloat32(m.cfg.Temperature),
		TopP:                ptrFloat32(m.cfg.TopP),
		MaxCompletionTokens: ptrInt(m.cfg.MaxTokens),
	}
	if options != nil && options.Model != nil && strings.TrimSpace(*options.Model) != "" {
		reqBody.Model = *options.Model
	}
	body, err := m.callGateway(ctx, reqBody)
	if err != nil {
		return nil, err
	}
	var parsed chatCompletionResponse
	if err = json.Unmarshal(body, &parsed); err != nil {
		return nil, gerror.Wrap(err, "解析模型响应失败")
	}
	if parsed.Error != nil {
		return nil, gerror.Newf("模型调用失败: code=%s message=%s", parsed.Error.Code, parsed.Error.Message)
	}
	if len(parsed.Choices) == 0 {
		return nil, gerror.New("模型返回为空")
	}
	content := strings.TrimSpace(fmt.Sprint(parsed.Choices[0].Message.Content))
	if content == "" {
		return nil, gerror.New("模型返回内容为空")
	}
	return &schema.Message{Role: schema.Assistant, Content: content}, nil
}

func (m *gatewayChatModel) Stream(ctx context.Context, input []*schema.Message, opts ...model.Option) (*schema.StreamReader[*schema.Message], error) {
	reqBody := chatCompletionRequest{
		Model:               m.cfg.ModelID,
		Messages:            toInputMessages(input),
		Stream:              true,
		Temperature:         ptrFloat32(m.cfg.Temperature),
		TopP:                ptrFloat32(m.cfg.TopP),
		MaxCompletionTokens: ptrInt(m.cfg.MaxTokens),
	}
	payload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, gerror.Wrap(err, "序列化流式请求失败")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, m.endpoint, bytes.NewReader(payload))
	if err != nil {
		return nil, gerror.Wrap(err, "创建流式请求失败")
	}
	m.setHeaders(req)
	resp, err := m.httpClient.Do(req)
	if err != nil {
		return nil, gerror.Wrap(err, "调用流式接口失败")
	}
	if resp.StatusCode >= http.StatusMultipleChoices {
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		return nil, gerror.Newf("流式接口异常: status=%d body=%s", resp.StatusCode, truncateText(string(body), 2048))
	}
	reader, writer := schema.Pipe[*schema.Message](16)
	go func() {
		defer resp.Body.Close()
		defer writer.Close()
		sc := bufio.NewScanner(resp.Body)
		for sc.Scan() {
			line := strings.TrimSpace(sc.Text())
			if strings.HasPrefix(line, "data:") {
				txt := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
				if txt != "" && txt != "[DONE]" {
					_ = writer.Send(&schema.Message{Role: schema.Assistant, Content: txt}, nil)
				}
			}
		}
	}()
	return reader, nil
}

func (m *gatewayChatModel) WithTools(_ []*schema.ToolInfo) (model.ToolCallingChatModel, error) {
	return m, nil
}

func (m *gatewayChatModel) callGateway(ctx context.Context, reqBody chatCompletionRequest) ([]byte, error) {
	payload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, gerror.Wrap(err, "序列化请求失败")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, m.endpoint, bytes.NewReader(payload))
	if err != nil {
		return nil, gerror.Wrap(err, "创建请求失败")
	}
	m.setHeaders(req)
	resp, err := m.httpClient.Do(req)
	if err != nil {
		return nil, gerror.Wrap(err, "调用网关失败")
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, gerror.Wrap(err, "读取响应失败")
	}
	if resp.StatusCode >= http.StatusMultipleChoices {
		return nil, gerror.Newf("网关异常: status=%d body=%s", resp.StatusCode, truncateText(string(body), 2048))
	}
	return body, nil
}

func (m *gatewayChatModel) setHeaders(req *http.Request) {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+m.cfg.APIKey)
	if m.cfg.GatewayUID != "" {
		req.Header.Set("AI-Gateway-Uid", m.cfg.GatewayUID)
	}
	if m.cfg.ProductName != "" {
		req.Header.Set("AI-Gateway-Product-Name", m.cfg.ProductName)
	}
	if m.cfg.IntentionKey != "" {
		req.Header.Set("Ai-Gateway-Intention-Code", m.cfg.IntentionKey)
	}
}

func toInputMessages(messages []*schema.Message) []chatCompletionMessage {
	out := make([]chatCompletionMessage, 0, len(messages))
	for _, msg := range messages {
		if msg == nil {
			continue
		}
		role := "user"
		if msg.Role == schema.System {
			role = "system"
		} else if msg.Role == schema.Assistant {
			role = "assistant"
		}
		out = append(out, chatCompletionMessage{
			Role:    role,
			Content: msg.Content,
		})
	}
	return out
}

func joinURL(baseURL, p string) string {
	baseURL = strings.TrimRight(baseURL, "/")
	p = strings.TrimSpace(p)
	if strings.HasPrefix(p, "http://") || strings.HasPrefix(p, "https://") {
		return p
	}
	u, err := url.Parse(baseURL)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return baseURL + "/" + strings.TrimLeft(p, "/")
	}
	u.Path = strings.TrimRight(u.Path, "/") + "/" + strings.TrimLeft(p, "/")
	return u.String()
}

func truncateText(s string, max int) string {
	if max <= 0 || len(s) <= max {
		return s
	}
	return s[:max] + "..."
}

func ptrFloat32(v float32) *float32 { return &v }
func ptrInt(v int) *int             { return &v }
