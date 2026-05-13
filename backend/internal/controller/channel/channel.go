package channel

import (
	"fmt"
	"strings"
	"time"

	authctrl "nex-backend/internal/controller/auth"

	"nex-backend/internal/pkg/pagination"
	"nex-backend/internal/pkg/response"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

type Controller struct{}

func New() *Controller { return &Controller{} }

func (c *Controller) List(r *ghttp.Request) {
	ctx := r.Context()
	pg := pagination.ParseFromRequest(r)
	search := r.GetQuery("search").String()
	chType := r.GetQuery("type").String()
	level := r.GetQuery("level").String()
	status := r.GetQuery("status").String()
	region := r.GetQuery("region").String()

	m := g.DB().Model("channels").Ctx(ctx)
	if search != "" {
		p := "%" + search + "%"
		m = m.Where("name LIKE ? OR contact_name LIKE ? OR email LIKE ?", p, p, p)
	}
	if chType != "" {
		m = m.Where("type", chType)
	}
	if level != "" {
		m = m.Where("level", level)
	}
	if status != "" {
		m = m.Where("status", status)
	}
	if region != "" {
		m = m.Where("region", region)
	}

	result, err := pagination.Query(m.OrderAsc("name"), pg)
	if err != nil {
		response.InternalError(r, err)
		return
	}

	channels := make([]g.Map, 0, len(result.Rows))
	for _, row := range result.Rows {
		channels = append(channels, channelRecordToJSON(row))
	}

	response.Ok(r, pagination.BuildResponse("channels", channels, result.Total, pg))
}

func (c *Controller) Detail(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("channels").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "渠道不存在")
		return
	}
	response.Ok(r, channelRecordToJSON(row))
}

func (c *Controller) Create(r *ghttp.Request) {
	ctx := r.Context()
	var req struct {
		ID            *string `json:"id"`
		Name          string  `json:"name"`
		Type          string  `json:"type"`
		Level         string  `json:"level"`
		ContactName   string  `json:"contact_name"`
		ContactPhone  string  `json:"contact_phone"`
		Email         string  `json:"email"`
		Region        string  `json:"region"`
		Status        *string `json:"status"`
		AgreementDate string  `json:"agreement_date"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	if strings.TrimSpace(req.Name) == "" {
		response.BadRequest(r, "name 必填")
		return
	}

	id := ""
	if req.ID != nil && strings.TrimSpace(*req.ID) != "" {
		id = strings.TrimSpace(*req.ID)
	} else {
		id = fmt.Sprintf("CH-%d", time.Now().UnixMilli())
	}

	status := "Active"
	if req.Status != nil && strings.TrimSpace(*req.Status) != "" {
		status = strings.TrimSpace(*req.Status)
	}

	data := g.Map{
		"id":             id,
		"name":           req.Name,
		"type":           req.Type,
		"level":          req.Level,
		"contact_name":   req.ContactName,
		"contact_phone":  req.ContactPhone,
		"email":          req.Email,
		"region":         req.Region,
		"status":         status,
		"agreement_date": req.AgreementDate,
	}

	_, err := g.DB().Model("channels").Ctx(ctx).Data(data).Insert()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	row, _ := g.DB().Model("channels").Ctx(ctx).Where("id", id).One()
	response.Created(r, channelRecordToJSON(row))
}

func (c *Controller) Update(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	var req struct {
		Name          *string `json:"name"`
		Type          *string `json:"type"`
		Level         *string `json:"level"`
		ContactName   *string `json:"contact_name"`
		ContactPhone  *string `json:"contact_phone"`
		Email         *string `json:"email"`
		Region        *string `json:"region"`
		Status        *string `json:"status"`
		AgreementDate *string `json:"agreement_date"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}

	data := g.Map{}
	if req.Name != nil {
		data["name"] = *req.Name
	}
	if req.Type != nil {
		data["type"] = *req.Type
	}
	if req.Level != nil {
		data["level"] = *req.Level
	}
	if req.ContactName != nil {
		data["contact_name"] = *req.ContactName
	}
	if req.ContactPhone != nil {
		data["contact_phone"] = *req.ContactPhone
	}
	if req.Email != nil {
		data["email"] = *req.Email
	}
	if req.Region != nil {
		data["region"] = *req.Region
	}
	if req.Status != nil {
		data["status"] = *req.Status
	}
	if req.AgreementDate != nil {
		data["agreement_date"] = *req.AgreementDate
	}

	if len(data) == 0 {
		response.BadRequest(r, "没有要更新的字段")
		return
	}

	res, err := g.DB().Model("channels").Ctx(ctx).Where("id", id).Data(data).Update()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		response.NotFound(r, "渠道不存在")
		return
	}

	row, _ := g.DB().Model("channels").Ctx(ctx).Where("id", id).One()
	response.Ok(r, channelRecordToJSON(row))
}

func (c *Controller) Users(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	ch, err := g.DB().Model("channels").Ctx(ctx).Where("id", id).One()
	if err != nil || ch.IsEmpty() {
		response.NotFound(r, "渠道不存在")
		return
	}

	rows, err := g.DB().Model("users").Ctx(ctx).Where("channel_id", id).All()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	out := make([]interface{}, 0, len(rows))
	for _, row := range rows {
		out = append(out, authctrl.BuildUserProfile(row))
	}
	response.Ok(r, out)
}

func (c *Controller) Delete(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	res, err := g.DB().Model("channels").Ctx(ctx).Where("id", id).Delete()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		response.NotFound(r, "渠道不存在")
		return
	}
	response.Ok(r, g.Map{"ok": true})
}

func channelRecordToJSON(row gdb.Record) g.Map {
	return g.Map{
		"id":            row["id"].String(),
		"name":          row["name"].String(),
		"type":          row["type"].String(),
		"level":         row["level"].String(),
		"contactName":   row["contact_name"].String(),
		"contactPhone":  row["contact_phone"].String(),
		"email":         row["email"].String(),
		"region":        row["region"].String(),
		"status":        row["status"].String(),
		"agreementDate": row["agreement_date"].String(),
	}
}
