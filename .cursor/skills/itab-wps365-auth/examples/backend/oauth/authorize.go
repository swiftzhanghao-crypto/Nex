// Package oauth 是 WPS OAuth2 协议层。无状态、纯函数，不持有任何 store。
package oauth

import (
	"fmt"
	"net/url"
	"strings"

	"wps365auth"
)

// AuthorizeURL 构造用户授权跳转链接。
// scope 多值用英文逗号分隔（注意：WPS 不是 OAuth2 标准的空格）。
func AuthorizeURL(c *wps365auth.Client, redirectURI, state string, scopes []string) string {
	if len(scopes) == 0 {
		scopes = c.Config.Scopes
	}
	params := url.Values{
		"client_id":     {c.Config.AppID},
		"response_type": {"code"},
		"redirect_uri":  {redirectURI},
		"scope":         {strings.Join(scopes, ",")},
		"state":         {state},
	}
	return fmt.Sprintf("%s/oauth2/auth?%s", c.Config.BaseURL, params.Encode())
}
