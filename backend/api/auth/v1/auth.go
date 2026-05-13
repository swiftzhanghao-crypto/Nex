package v1

type LoginReq struct {
	Email    string `json:"email" v:"required"`
	Password string `json:"password" v:"required"`
}

type LoginRes struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

type UserProfile struct {
	ID           string   `json:"id"`
	AccountID    string   `json:"accountId"`
	Name         string   `json:"name"`
	Email        string   `json:"email"`
	Phone        string   `json:"phone"`
	Roles        []string `json:"roles"`
	UserType     string   `json:"userType"`
	Status       string   `json:"status"`
	Avatar       *string  `json:"avatar"`
	DepartmentID *string  `json:"departmentId"`
	MonthBadge   *string  `json:"monthBadge"`
	ChannelID    *string  `json:"channelId,omitempty"`
}
