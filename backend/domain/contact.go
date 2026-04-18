package domain

// Contact 联系人
type Contact struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	AvatarURL  string `json:"avatarUrl"`
	WildFireID string `json:"wildFireId"`
	// IsSpecial 标记是否为顶部固定项（新好友/收藏群组/订阅频道）
	IsSpecial bool `json:"isSpecial"`
	// SpecialKey 特殊项 key：new_friends / favorite_groups / subscribed_channels
	SpecialKey string `json:"specialKey,omitempty"`
}

// DiscoverFeature 发现 Tab 中的功能项
type DiscoverFeature struct {
	Key         string `json:"key"`
	Title       string `json:"title"`
	Icon        string `json:"icon"`        // lucide 图标名
	IconColor   string `json:"iconColor"`   // Tailwind 类名：text-green-500 等
	Description string `json:"description,omitempty"`
}

// SettingItem 我的 Tab 中的设置项
type SettingItem struct {
	Key       string `json:"key"`
	Title     string `json:"title"`
	Icon      string `json:"icon"`
	IconColor string `json:"iconColor"`
}
