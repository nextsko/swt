package services

import (
	"fmt"
	"strings"
	"time"

	"changeme/backend/domain"
	"changeme/backend/repository"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// MessageStatusEvent 消息状态变更事件，前端订阅 "chat:status" 实时更新"已发送/已读"
type MessageStatusEvent struct {
	MessageID      string               `json:"messageId"`
	ConversationID string               `json:"conversationId"`
	Status         domain.MessageStatus `json:"status"`
}

// ChatService 提供会话/消息相关的前端调用接口
type ChatService struct {
	repo repository.ConversationRepository
}

func NewChatService(r repository.ConversationRepository) *ChatService {
	return &ChatService{repo: r}
}

// GetConversations 返回会话列表（倒序）
func (s *ChatService) GetConversations() ([]domain.Conversation, error) {
	return s.repo.ListConversations()
}

// GetConversation 根据 ID 获取单个会话
func (s *ChatService) GetConversation(id string) (*domain.Conversation, error) {
	return s.repo.GetConversation(id)
}

// GetMessages 获取某会话的最新 limit 条消息（按时间正序）
func (s *ChatService) GetMessages(conversationID string, limit int) ([]domain.Message, error) {
	return s.repo.ListMessages(conversationID, limit)
}

// SendText 发送文本消息。初始 status=sending；两个计时器模拟 sent→delivered→read。
// mentions: 被 @ 的 userID/botID 列表。
func (s *ChatService) SendText(
	conversationID string,
	text string,
	mentions []string,
) (*domain.Message, error) {
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return nil, fmt.Errorf("text cannot be empty")
	}
	msg := s.buildSelfMessage(conversationID, domain.MsgText)
	msg.Text = trimmed
	msg.Mentions = mentions
	if err := s.repo.AppendMessage(msg); err != nil {
		return nil, err
	}
	// 异步推进状态：sending -> sent -> delivered（模拟对方收到）
	go s.advanceStatus(msg.ID, conversationID)
	return &msg, nil
}

// SendImage 发送图片消息
func (s *ChatService) SendImage(conversationID, mediaURL string) (*domain.Message, error) {
	msg := s.buildSelfMessage(conversationID, domain.MsgImage)
	msg.MediaURL = mediaURL
	if err := s.repo.AppendMessage(msg); err != nil {
		return nil, err
	}
	go s.advanceStatus(msg.ID, conversationID)
	return &msg, nil
}

// SendVoice 语音
func (s *ChatService) SendVoice(conversationID string, durationSec int) (*domain.Message, error) {
	msg := s.buildSelfMessage(conversationID, domain.MsgVoice)
	msg.DurationSec = durationSec
	if err := s.repo.AppendMessage(msg); err != nil {
		return nil, err
	}
	go s.advanceStatus(msg.ID, conversationID)
	return &msg, nil
}

// SendFile 文件
func (s *ChatService) SendFile(conversationID, fileName, mediaURL string) (*domain.Message, error) {
	msg := s.buildSelfMessage(conversationID, domain.MsgFile)
	msg.FileName = fileName
	msg.MediaURL = mediaURL
	if err := s.repo.AppendMessage(msg); err != nil {
		return nil, err
	}
	go s.advanceStatus(msg.ID, conversationID)
	return &msg, nil
}

// SendLocation 位置
func (s *ChatService) SendLocation(conversationID, title string) (*domain.Message, error) {
	msg := s.buildSelfMessage(conversationID, domain.MsgLoc)
	msg.Text = title
	if err := s.repo.AppendMessage(msg); err != nil {
		return nil, err
	}
	go s.advanceStatus(msg.ID, conversationID)
	return &msg, nil
}

// MarkRead 进入会话详情时清零未读，并把自己过往消息标记为 read（仅影响 UI "已读"标志）。
func (s *ChatService) MarkRead(conversationID string) error {
	return s.repo.MarkConversationRead(conversationID)
}

func (s *ChatService) SetPinned(conversationID string, pinned bool) error {
	return s.repo.SetConversationPinned(conversationID, pinned)
}

func (s *ChatService) SetMute(conversationID string, mute bool) error {
	return s.repo.SetConversationMute(conversationID, mute)
}

func (s *ChatService) DeleteConversation(conversationID string) error {
	return s.repo.DeleteConversation(conversationID)
}

// CreateGroup 创建群聊。memberIDs 可混合 u_* 与 bot_* ID。
func (s *ChatService) CreateGroup(title string, memberIDs []string) (*domain.Conversation, error) {
	return s.repo.CreateGroup(title, "u_me", memberIDs)
}

// SetDraft 保存输入框草稿。
func (s *ChatService) SetDraft(conversationID, draft string) error {
	return s.repo.SetDraft(conversationID, draft)
}

// RecallMessage 撤回自己发送的消息，将其转成 tip "XX 撤回了一条消息"
func (s *ChatService) RecallMessage(messageID string) error {
	return s.repo.RecallMessage(messageID)
}

// DeleteMessage 删除消息（本地数据层删除）
func (s *ChatService) DeleteMessage(messageID string) error {
	return s.repo.DeleteMessage(messageID)
}

// buildSelfMessage 通用的"我的"消息骨架。
func (s *ChatService) buildSelfMessage(conversationID string, t domain.MessageType) domain.Message {
	now := time.Now()
	return domain.Message{
		ID:             fmt.Sprintf("m_%d", now.UnixNano()),
		ConversationID: conversationID,
		SenderID:       "u_me",
		SenderName:     "零零三03",
		SenderAvatar:   "https://api.dicebear.com/9.x/adventurer/svg?seed=me",
		Type:           t,
		Timestamp:      now.UnixMilli(),
		IsSelf:         true,
		Status:         domain.StatusSending,
	}
}

// advanceStatus 模拟消息状态流转：100ms sent -> 1.2s delivered。
// "read" 由机器人回复完成 或 用户切到该聊天 时触发。
func (s *ChatService) advanceStatus(messageID, conversationID string) {
	time.Sleep(100 * time.Millisecond)
	_ = s.repo.UpdateMessageStatus(messageID, domain.StatusSent)
	s.emitStatus(messageID, conversationID, domain.StatusSent)
	time.Sleep(1 * time.Second)
	_ = s.repo.UpdateMessageStatus(messageID, domain.StatusDelivered)
	s.emitStatus(messageID, conversationID, domain.StatusDelivered)
}

func (s *ChatService) emitStatus(messageID, conversationID string, status domain.MessageStatus) {
	app := application.Get()
	if app == nil {
		return
	}
	app.Event.Emit("chat:status", MessageStatusEvent{
		MessageID:      messageID,
		ConversationID: conversationID,
		Status:         status,
	})
}
