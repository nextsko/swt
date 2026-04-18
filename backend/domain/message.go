package domain

// MessageType 消息类型
type MessageType string

const (
	MsgText  MessageType = "text"
	MsgImage MessageType = "image"
	MsgVideo MessageType = "video"
	MsgVoice MessageType = "voice"
	MsgCall  MessageType = "call" // 音视频通话记录
	MsgTip   MessageType = "tip"  // 系统提示（如“已是好友”）
	MsgFile  MessageType = "file" // 文件
	MsgLoc   MessageType = "location"
	MsgRed   MessageType = "redpacket"
)

// MessageStatus 消息发送/投递状态（主要用于 IsSelf 消息）
type MessageStatus string

const (
	StatusSending   MessageStatus = "sending"
	StatusSent      MessageStatus = "sent"
	StatusDelivered MessageStatus = "delivered"
	StatusRead      MessageStatus = "read"
	StatusFailed    MessageStatus = "failed"
)

// Message 单条消息
type Message struct {
	ID             string      `json:"id"`
	ConversationID string      `json:"conversationId"`
	SenderID       string      `json:"senderId"`
	SenderName     string      `json:"senderName"`
	SenderAvatar   string      `json:"senderAvatar"`
	Type           MessageType `json:"type"`
	// 文本消息内容
	Text string `json:"text,omitempty"`
	// 媒体类消息 URL（图片、视频缩略图、语音文件、文件等）
	MediaURL string `json:"mediaUrl,omitempty"`
	// 文件名（MsgFile）
	FileName string `json:"fileName,omitempty"`
	// 视频/语音时长（秒）
	DurationSec int `json:"durationSec,omitempty"`
	// Unix 毫秒时间戳
	Timestamp int64 `json:"timestamp"`
	// 是否为当前用户发送（用于决定气泡方向）
	IsSelf bool `json:"isSelf"`
	// 消息投递状态（IsSelf 消息使用；他人消息为空）
	Status MessageStatus `json:"status,omitempty"`
	// 群聊已读列表（sender 之外的成员 ID，用于"已读 N/M"）
	ReadBy []string `json:"readBy,omitempty"`
	// 被 @ 的用户/机器人 ID 列表（mention）
	Mentions []string `json:"mentions,omitempty"`
}
