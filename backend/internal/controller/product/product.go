package product

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"

	"nex-backend/internal/pkg/pagination"
	"nex-backend/internal/pkg/response"
)

type Controller struct{}

func New() *Controller { return &Controller{} }

func (c *Controller) List(r *ghttp.Request) {
	ctx := r.Context()
	pg := pagination.ParseFromRequest(r)
	category := r.GetQuery("category").String()
	status := r.GetQuery("status").String()
	search := r.GetQuery("search").String()

	m := g.DB().Model("products").Ctx(ctx)
	if category != "" {
		m = m.Where("category", category)
	}
	if status != "" {
		m = m.Where("status", status)
	}
	if search != "" {
		pat := "%" + search + "%"
		m = m.Where("name LIKE ? OR id LIKE ?", pat, pat)
	}

	result, err := pagination.Query(m.OrderAsc("name"), pg)
	if err != nil {
		response.InternalError(r, err)
		return
	}

	products := make([]g.Map, 0, len(result.Rows))
	for _, row := range result.Rows {
		products = append(products, buildProduct(row))
	}

	response.Ok(r, pagination.BuildResponse("products", products, result.Total, pg))
}

func (c *Controller) Detail(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("products").Ctx(ctx).Where("id", id).One()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	if row.IsEmpty() {
		response.NotFound(r, "产品不存在")
		return
	}
	response.Ok(r, buildProduct(row))
}

type productCreateReq struct {
	Name            string      `json:"name"`
	Category        string      `json:"category"`
	SubCategory     string      `json:"sub_category"`
	Description     string      `json:"description"`
	Status          string      `json:"status"`
	Tags            interface{} `json:"tags"`
	Skus            interface{} `json:"skus"`
	Composition     interface{} `json:"composition"`
	InstallPackages interface{} `json:"installPackages"`
	PackageID       string      `json:"package_id"`
	Rights          interface{} `json:"rights"`
	LicenseTpl      string      `json:"license_tpl"`
}

func (c *Controller) Create(r *ghttp.Request) {
	ctx := r.Context()
	var req productCreateReq
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	if req.Name == "" || req.Category == "" {
		response.BadRequest(r, "name 与 category 为必填")
		return
	}

	status := req.Status
	if status == "" {
		status = "OnShelf"
	}

	id := fmt.Sprintf("PRD-%d", time.Now().UnixMilli())
	_, err := g.DB().Model("products").Ctx(ctx).Data(g.Map{
		"id":            id,
		"name":          req.Name,
		"category":      req.Category,
		"sub_category":  req.SubCategory,
		"description":   req.Description,
		"status":        status,
		"tags":          marshalJSONField(req.Tags, "[]"),
		"skus":          marshalJSONField(req.Skus, "[]"),
		"composition":   marshalJSONField(req.Composition, "[]"),
		"install_pkgs":  marshalJSONField(req.InstallPackages, "[]"),
		"package_id":    req.PackageID,
		"rights":        marshalJSONField(req.Rights, "[]"),
		"license_tpl":   req.LicenseTpl,
	}).Insert()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	row, _ := g.DB().Model("products").Ctx(ctx).Where("id", id).One()
	response.Created(r, buildProduct(row))
}

type productUpdateReq struct {
	Name            *string          `json:"name"`
	Category        *string          `json:"category"`
	SubCategory     *string          `json:"sub_category"`
	Description     *string          `json:"description"`
	Status          *string          `json:"status"`
	Tags            *json.RawMessage `json:"tags"`
	Skus            *json.RawMessage `json:"skus"`
	Composition     *json.RawMessage `json:"composition"`
	InstallPackages *json.RawMessage `json:"installPackages"`
	PackageID       *string          `json:"package_id"`
	Rights          *json.RawMessage `json:"rights"`
	LicenseTpl      *string          `json:"license_tpl"`
}

func (c *Controller) Update(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	exists, err := g.DB().Model("products").Ctx(ctx).Where("id", id).Count()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	if exists == 0 {
		response.NotFound(r, "产品不存在")
		return
	}

	var req productUpdateReq
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}

	data := g.Map{}
	if req.Name != nil {
		data["name"] = *req.Name
	}
	if req.Category != nil {
		data["category"] = *req.Category
	}
	if req.SubCategory != nil {
		data["sub_category"] = *req.SubCategory
	}
	if req.Description != nil {
		data["description"] = *req.Description
	}
	if req.Status != nil {
		data["status"] = *req.Status
	}
	if req.Tags != nil {
		data["tags"] = string(*req.Tags)
	}
	if req.Skus != nil {
		data["skus"] = string(*req.Skus)
	}
	if req.Composition != nil {
		data["composition"] = string(*req.Composition)
	}
	if req.InstallPackages != nil {
		data["install_pkgs"] = string(*req.InstallPackages)
	}
	if req.PackageID != nil {
		data["package_id"] = *req.PackageID
	}
	if req.Rights != nil {
		data["rights"] = string(*req.Rights)
	}
	if req.LicenseTpl != nil {
		data["license_tpl"] = *req.LicenseTpl
	}

	if len(data) == 0 {
		row, _ := g.DB().Model("products").Ctx(ctx).Where("id", id).One()
		response.Ok(r, buildProduct(row))
		return
	}

	_, err = g.DB().Model("products").Ctx(ctx).Where("id", id).Data(data).Update()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	row, _ := g.DB().Model("products").Ctx(ctx).Where("id", id).One()
	response.Ok(r, buildProduct(row))
}

func (c *Controller) Delete(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	result, err := g.DB().Model("products").Ctx(ctx).Where("id", id).Delete()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		response.NotFound(r, "产品不存在")
		return
	}
	response.Ok(r, g.Map{"ok": true})
}

func (c *Controller) MetaChannels(r *ghttp.Request) {
	ctx := r.Context()
	rows, err := g.DB().Model("channels").Ctx(ctx).Fields("id", "name", "type", "level", "status").OrderAsc("name").All()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	out := make([]g.Map, 0, len(rows))
	for _, row := range rows {
		out = append(out, g.Map{
			"id":     row["id"].String(),
			"name":   row["name"].String(),
			"type":   row["type"].String(),
			"level":  row["level"].String(),
			"status": row["status"].String(),
		})
	}
	response.Ok(r, out)
}

func (c *Controller) MetaOpportunities(r *ghttp.Request) {
	ctx := r.Context()
	rows, err := g.DB().Model("opportunities").Ctx(ctx).
		Fields("id", "name", "customer_name", "stage", "amount").
		OrderAsc("name").
		All()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	out := make([]g.Map, 0, len(rows))
	for _, row := range rows {
		item := g.Map{
			"id":            row["id"].String(),
			"name":          row["name"].String(),
			"customer_name": row["customer_name"].String(),
			"stage":         row["stage"].String(),
			"amount":        row["amount"].Val(),
		}
		out = append(out, item)
	}
	response.Ok(r, out)
}

func buildProduct(row map[string]*g.Var) g.Map {
	return g.Map{
		"id":              row["id"].String(),
		"name":            row["name"].String(),
		"category":        row["category"].String(),
		"subCategory":     row["sub_category"].String(),
		"description":     row["description"].String(),
		"status":          row["status"].String(),
		"tags":            parseJSON(row["tags"].String(), "[]"),
		"skus":            parseJSON(row["skus"].String(), "[]"),
		"composition":     parseJSON(row["composition"].String(), "[]"),
		"installPackages": parseJSON(row["install_pkgs"].String(), "[]"),
		"packageId":       row["package_id"].String(),
		"rights":          parseJSON(row["rights"].String(), "[]"),
		"licenseTemplate": row["license_tpl"].String(),
	}
}

func parseJSON(s, fallback string) interface{} {
	if s == "" {
		s = fallback
	}
	var v interface{}
	if err := json.Unmarshal([]byte(s), &v); err != nil {
		if err2 := json.Unmarshal([]byte(fallback), &v); err2 != nil {
			return nil
		}
	}
	return v
}

func marshalJSONField(v interface{}, empty string) string {
	if v == nil {
		return empty
	}
	b, err := json.Marshal(v)
	if err != nil {
		return empty
	}
	return string(b)
}
