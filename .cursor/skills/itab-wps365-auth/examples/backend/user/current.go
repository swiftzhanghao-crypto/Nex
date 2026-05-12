package user

import (
	"context"
	"fmt"

	"wps365auth"
)

type Info struct {
	UserName  string `json:"user_name"`
	Avatar    string `json:"avatar"`
	ID        string `json:"id"`
	CompanyID string `json:"company_id"`
}

type currentResponse struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
	Data *Info  `json:"data"`
}

// GetCurrent 获取当前授权用户信息（V7 /v7/users/current）。
func GetCurrent(ctx context.Context, c *wps365auth.Client, accessToken string) (*Info, error) {
	var resp currentResponse
	if err := c.Do(ctx, "GET", "/v7/users/current", accessToken, nil, &resp); err != nil {
		return nil, err
	}
	if resp.Code != 0 {
		return nil, &wps365auth.APIError{Code: resp.Code, Msg: resp.Msg}
	}
	if resp.Data == nil {
		return nil, fmt.Errorf("user: empty data in response")
	}
	return resp.Data, nil
}
