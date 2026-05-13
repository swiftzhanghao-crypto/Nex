package response

import (
	"net/http"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

func Ok(r *ghttp.Request, data interface{}) {
	r.Response.WriteJsonExit(data)
}

func OkWithStatus(r *ghttp.Request, status int, data interface{}) {
	r.Response.Status = status
	r.Response.WriteJsonExit(data)
}

func Created(r *ghttp.Request, data interface{}) {
	OkWithStatus(r, http.StatusCreated, data)
}

func Fail(r *ghttp.Request, status int, message string) {
	r.Response.Status = status
	r.Response.WriteJsonExit(g.Map{"error": message})
}

func BadRequest(r *ghttp.Request, message string) {
	Fail(r, http.StatusBadRequest, message)
}

func NotFound(r *ghttp.Request, message string) {
	Fail(r, http.StatusNotFound, message)
}

func Forbidden(r *ghttp.Request, message string) {
	Fail(r, http.StatusForbidden, message)
}

func InternalError(r *ghttp.Request, err error) {
	Fail(r, http.StatusInternalServerError, "服务器内部错误")
	g.Log().Errorf(r.Context(), "internal error: %+v", err)
}
