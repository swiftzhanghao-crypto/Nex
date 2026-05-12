package crmexample

import (
	"context"
	"strings"

	"github.com/gogf/gf/v2/errors/gerror"
)

type DemoXOQLReq struct {
	SQL                  string `json:"sql"`
	Paged                bool   `json:"paged"`
	PageSize             int    `json:"pageSize"`
	IncludeAdminCriteria bool   `json:"includeAdminCriteria"`
}

type DemoXOQLRes struct {
	Code    string                   `json:"code"`
	Msg     string                   `json:"msg"`
	Count   int                      `json:"count"`
	Records []map[string]interface{} `json:"records"`
}

type DemoController struct {
	xsy *XSYService
}

func NewDemoController(xsy *XSYService) *DemoController {
	return &DemoController{xsy: xsy}
}

// ExecuteDemoSQL 仅用于联调演示：
// 1) 只允许 select 语句；
// 2) 允许可选分页聚合；
// 3) 不包含 risk_board 业务口径与权限逻辑。
func (c *DemoController) ExecuteDemoSQL(ctx context.Context, req *DemoXOQLReq) (*DemoXOQLRes, error) {
	sql := strings.TrimSpace(req.SQL)
	if sql == "" {
		return nil, gerror.New("sql 不能为空")
	}
	if !isReadonlySelect(sql) {
		return nil, gerror.New("仅允许只读 select SQL")
	}
	if len(sql) > 2000 {
		return nil, gerror.New("sql 过长，最大 2000 字符")
	}

	var (
		out *XOQLQueryResponse
		err error
	)
	if req.Paged {
		out, err = c.xsy.QueryXOQLPaged(ctx, sql, req.PageSize, req.IncludeAdminCriteria)
	} else {
		out, err = c.xsy.QueryXOQL(ctx, sql, req.IncludeAdminCriteria)
	}
	if err != nil {
		return nil, err
	}
	res := &DemoXOQLRes{
		Code: out.Code,
		Msg:  out.Msg,
	}
	if out.Data != nil {
		res.Count = out.Data.Count
		res.Records = out.Data.Records
	}
	return res, nil
}

func isReadonlySelect(sql string) bool {
	compact := strings.ToLower(strings.TrimSpace(sql))
	if !strings.HasPrefix(compact, "select ") {
		return false
	}
	blocked := []string{
		" update ",
		" insert ",
		" delete ",
		" drop ",
		" alter ",
		" truncate ",
	}
	padded := " " + compact + " "
	for _, kw := range blocked {
		if strings.Contains(padded, kw) {
			return false
		}
	}
	return true
}
