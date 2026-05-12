package llmexample

import (
	"context"
	"encoding/json"

	"github.com/gogf/gf/v2/frame/g"
)

type QueryReq struct {
	g.Meta `path:"/query" tags:"LLM" method:"post" summary:"根据提示词和数据调用大模型"`
	Prompt string          `json:"prompt" v:"required#prompt 不能为空"`
	Data   json.RawMessage `json:"data" v:"required#data 不能为空"`
	Model  string          `json:"model"`
}

type QueryRes struct {
	Content string `json:"content"`
	Result  any    `json:"result,omitempty"`
}

type Controller struct {
	svc *Service
}

func NewController(svc *Service) *Controller {
	return &Controller{svc: svc}
}

func (c *Controller) Query(ctx context.Context, req *QueryReq) (*QueryRes, error) {
	content, result, err := c.svc.Query(ctx, req.Prompt, req.Data, req.Model)
	if err != nil {
		return nil, err
	}
	return &QueryRes{
		Content: content,
		Result:  result,
	}, nil
}
