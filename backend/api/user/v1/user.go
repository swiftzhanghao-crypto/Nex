package v1

type UserListReq struct {
	Page     int    `json:"page" d:"1"`
	PageSize int    `json:"pageSize" d:"50"`
	Search   string `json:"search"`
	UserType string `json:"userType"`
	Status   string `json:"status"`
	Role     string `json:"role"`
}

type UserListRes struct {
	Users      []UserItem `json:"users"`
	Total      int        `json:"total"`
	Page       int        `json:"page"`
	PageSize   int        `json:"pageSize"`
	TotalPages int        `json:"totalPages"`
}

type UserItem struct {
	ID           string      `json:"id"`
	AccountID    string      `json:"accountId"`
	Name         string      `json:"name"`
	Email        string      `json:"email"`
	Phone        string      `json:"phone"`
	Roles        interface{} `json:"roles"`
	UserType     string      `json:"userType"`
	Status       string      `json:"status"`
	Avatar       *string     `json:"avatar"`
	DepartmentID *string     `json:"departmentId"`
	MonthBadge   *string     `json:"monthBadge"`
	ChannelID    *string     `json:"channelId,omitempty"`
	SortOrder    int         `json:"sortOrder"`
	CreatedAt    string      `json:"createdAt"`
	UpdatedAt    string      `json:"updatedAt"`
}

type UserUpdateReq struct {
	Name         *string     `json:"name"`
	Email        *string     `json:"email"`
	Phone        *string     `json:"phone"`
	Roles        interface{} `json:"roles"`
	UserType     *string     `json:"userType"`
	Status       *string     `json:"status"`
	Avatar       *string     `json:"avatar"`
	DepartmentID *string     `json:"departmentId"`
	MonthBadge   *string     `json:"monthBadge"`
	ChannelID    *string     `json:"channelId"`
	Password     *string     `json:"password"`
}

type DepartmentItem struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
	ParentID    *string `json:"parentId"`
}

type RoleItem struct {
	ID                string      `json:"id"`
	Name              string      `json:"name"`
	Description       string      `json:"description"`
	Permissions       interface{} `json:"permissions"`
	IsSystem          bool        `json:"isSystem"`
	RowPermissions    interface{} `json:"rowPermissions"`
	RowLogic          interface{} `json:"rowLogic"`
	ColumnPermissions interface{} `json:"columnPermissions"`
	AppPermissions    interface{} `json:"appPermissions"`
	SortOrder         int         `json:"sortOrder"`
}

type RoleCreateReq struct {
	ID                string      `json:"id" v:"required"`
	Name              string      `json:"name" v:"required"`
	Description       string      `json:"description"`
	Permissions       interface{} `json:"permissions"`
	RowPermissions    interface{} `json:"rowPermissions"`
	RowLogic          interface{} `json:"rowLogic"`
	ColumnPermissions interface{} `json:"columnPermissions"`
	AppPermissions    interface{} `json:"appPermissions"`
}

type RoleUpdateReq struct {
	Name              *string     `json:"name"`
	Description       *string     `json:"description"`
	Permissions       interface{} `json:"permissions"`
	RowPermissions    interface{} `json:"rowPermissions"`
	RowLogic          interface{} `json:"rowLogic"`
	ColumnPermissions interface{} `json:"columnPermissions"`
	AppPermissions    interface{} `json:"appPermissions"`
}
