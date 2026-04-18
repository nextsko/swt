package repository

import "changeme/backend/domain"

// ConversationRepository 会话与消息数据访问接口
type ConversationRepository interface {
	ListConversations() ([]domain.Conversation, error)
	GetConversation(id string) (*domain.Conversation, error)
	ListMessages(convID string, limit int) ([]domain.Message, error)
	AppendMessage(msg domain.Message) error
	// UpdateMessageText 更新指定消息的文本内容（用于流式回复落盘）
	UpdateMessageText(messageID, text string) error
	// UpdateMessageStatus 修改 IsSelf 消息的投递状态
	UpdateMessageStatus(messageID string, status domain.MessageStatus) error
	// MarkMessageReadBy 把某成员加入到消息的已读列表
	MarkMessageReadBy(messageID, memberID string) error
	// MarkConversationRead 清零未读，并把本会话中"别人发的"最近消息视为已读（针对 UI）
	MarkConversationRead(conversationID string) error
	// RecallMessage 将消息置为 tip 类型表示"已撤回"，清空原文/媒体。
	RecallMessage(messageID string) error
	// DeleteMessage 物理删除某条消息
	DeleteMessage(messageID string) error
	// CreateGroup 新建群聊；ownerID 是自己的 ID；memberIDs 可混合 u_* 与 bot_* ID
	CreateGroup(title string, ownerID string, memberIDs []string) (*domain.Conversation, error)
	// UpsertBotConversation 为 bot 返回/创建单聊会话
	UpsertBotConversation(bot domain.Bot, selfID string) (*domain.Conversation, error)
	// SetDraft 存草稿（为空表示清空）
	SetDraft(conversationID, draft string) error
}

// ContactRepository 联系人数据访问接口
type ContactRepository interface {
	ListSpecial() ([]domain.Contact, error) // 顶部固定项
	ListContacts() ([]domain.Contact, error)
	GetContact(id string) (*domain.Contact, error)
}

// BotRepository 机器人数据访问接口
type BotRepository interface {
	ListBots() ([]domain.Bot, error)       // 全部（市场）
	ListInstalled() ([]domain.Bot, error)  // 已安装（用于联系人 Tab / @人）
	GetBot(id string) (*domain.Bot, error) // 按 ID 取
	SetInstalled(id string, installed bool) error
}

// DiscoverRepository 发现 Tab 数据访问接口
type DiscoverRepository interface {
	ListFeatures() ([]domain.DiscoverFeature, error)
}

// ProfileRepository 个人中心数据访问接口
type ProfileRepository interface {
	GetCurrentUser() (*domain.User, error)
	ListSettings() ([]domain.SettingItem, error)
}
