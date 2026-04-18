package domain

// User 代表一个用户（当前登录用户或其他参与者）
type User struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatarUrl"`
	WildFireID string `json:"wildFireId"` // 野火号
	Bio       string `json:"bio"`
}
