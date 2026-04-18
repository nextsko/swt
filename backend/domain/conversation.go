package domain

// ConversationType 会话类型
type ConversationType string

const (
	ConvTypeSingle ConversationType = "single" // 单聊（人-人）
	ConvTypeBot    ConversationType = "bot"    // 单聊（人-机器人）
	ConvTypeGroup  ConversationType = "group"  // 群聊
	ConvTypeSystem ConversationType = "system" // 系统通知
)

// Conversation 会话摘要（用于列表展示）
type Conversation struct {
	ID          string           `json:"id"`
	Type        ConversationType `json:"type"`
	Title       string           `json:"title"`
	AvatarURL   string           `json:"avatarUrl"`
	LastMessage string           `json:"lastMessage"`
	LastTime    int64            `json:"lastTime"` // Unix 毫秒
	UnreadCount int              `json:"unreadCount"`
	Pinned      bool             `json:"pinned"`
	MuteNotice  bool             `json:"muteNotice"`
	// 群聊专用：参与者头像（用于九宫格）
	MemberAvatars []string `json:"memberAvatars,omitempty"`
	// 所有参与者 ID（含 u_me；群聊里包含机器人 ID）
	MemberIDs []string `json:"memberIds,omitempty"`
	// 群主 ID（单聊/机器人会话为空）
	OwnerID string `json:"ownerId,omitempty"`
	// 单聊-机器人会话：绑定的 bot ID
	BotID string `json:"botId,omitempty"`
	// 输入框草稿
	Draft string `json:"draft,omitempty"`
}
