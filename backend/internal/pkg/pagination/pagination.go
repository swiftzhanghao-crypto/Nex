package pagination

import (
	"math"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

type Params struct {
	Page int
	Size int
}

func ParseFromRequest(r *ghttp.Request) Params {
	page := r.GetQuery("page", 1).Int()
	size := r.GetQuery("size", 50).Int()
	if r.GetQuery("pageSize").Int() > 0 {
		size = r.GetQuery("pageSize").Int()
	}
	return Normalize(page, size)
}

func Normalize(page, size int) Params {
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 50
	}
	if size > 200 {
		size = 200
	}
	return Params{Page: page, Size: size}
}

func TotalPages(total, size int) int {
	if size <= 0 {
		return 0
	}
	return int(math.Ceil(float64(total) / float64(size)))
}

func (p Params) Offset() int {
	return (p.Page - 1) * p.Size
}

type Result struct {
	Rows  gdb.Result
	Total int
}

func Query(m *gdb.Model, p Params) (*Result, error) {
	total, err := m.Count()
	if err != nil {
		return nil, err
	}
	rows, err := m.Limit(p.Size).Offset(p.Offset()).All()
	if err != nil {
		return nil, err
	}
	return &Result{Rows: rows, Total: total}, nil
}

func BuildResponse(dataKey string, items interface{}, total int, p Params) g.Map {
	return g.Map{
		dataKey:      items,
		"total":      total,
		"page":       p.Page,
		"size":       p.Size,
		"totalPages": TotalPages(total, p.Size),
	}
}
