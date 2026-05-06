package services

import (
	"context"
	"fmt"
	"runtime/debug"
	"time"

	"changeme/backend/agent"
	"changeme/backend/domain"
	"changeme/backend/repository"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// logf 走 println，Android 下会进 logcat "Go" tag。
func logf(format string, a ...any) {
	println("[agent_service] " + fmt.Sprintf(format, a...))
}

// ChatChunkEvent 通过 Wails Event "chat:chunk" 推送给前端的流式增量。
type ChatChunkEvent struct {
	MessageID      string `json:"messageId"`
	ConversationID string `json:"conversationId"`
	Delta          string `json:"delta"`
	Done           bool   `json:"done"`
	Error          string `json:"error,omitempty"`
}

// AgentService：
// - 维护一个 agent.Pool（一个 MiniMax Key 派生多 persona）
// - SendTextToBot：单聊机器人会话，用户消息 + 机器人占位消息 + 流式回复
// - MentionBots：群聊中被 @ 的每个 bot 各回复一条（串行或并行，这里串行简单起见）
type AgentService struct {
	convs repository.ConversationRepository
	bots  repository.BotRepository
	pool  *agent.Pool
}

// NewAgentService 构造时即创建 Pool；如果 Key 缺失 Pool.Ready() 为 false。
func NewAgentService(convs repository.ConversationRepository, bots repository.BotRepository) *AgentService {
	pool := agent.NewPool(agent.LoadConfig())
	pool.SetCreateBotToolSet(agent.NewCreateBotToolSet(bots))
	return &AgentService{
		convs: convs,
		bots:  bots,
		pool:  pool,
	}
}

// IsReady 暴露给前端判断是否启用 AI 能力。
func (s *AgentService) IsReady() bool { return s.pool.Ready() }

// InvalidatePool 使指定 bot 的 Agent 缓存失效（实现 AgentPoolInvalidator）。
func (s *AgentService) InvalidatePool(botID string) { s.pool.Invalidate(botID) }

// SendTextToBot 用户在机器人单聊会话里发送消息：
// - 从 conversation 里取绑定的 botID
// - 持久化用户消息 + 预占位机器人消息
// - 异步流式生成回复
// 返回 [userMsg, botPlaceholder]，前端追加到消息列表后等待 chat:chunk/chat:status。
func (s *AgentService) SendTextToBot(conversationID, text string) ([]domain.Message, error) {
	if conversationID == "" || text == "" {
		return nil, fmt.Errorf("conversationID and text are required")
	}
	conv, err := s.convs.GetConversation(conversationID)
	if err != nil {
		return nil, err
	}
	if conv.BotID == "" {
		return nil, fmt.Errorf("conversation %s is not bound to any bot", conversationID)
	}
	bot, err := s.bots.GetBot(conv.BotID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	userMsg := domain.Message{
		ID:             fmt.Sprintf("m_%d", now.UnixNano()),
		ConversationID: conversationID,
		SenderID:       "u_me",
		SenderName:     "零零三03",
		SenderAvatar:   "https://api.dicebear.com/9.x/adventurer/svg?seed=me",
		Type:           domain.MsgText,
		Text:           text,
		Timestamp:      now.UnixMilli(),
		IsSelf:         true,
		Status:         domain.StatusSending,
	}
	if err := s.convs.AppendMessage(userMsg); err != nil {
		return nil, err
	}
	// 用户消息立即标为 sent；稍后 bot 回复完成时再标 read（都走 chat:status 事件）
	_ = s.convs.UpdateMessageStatus(userMsg.ID, domain.StatusSent)
	userMsg.Status = domain.StatusSent
	// 异步触发事件，避免 JNI 在同一栈调用里二次上升 panic
	go emitStatus(conversationID, userMsg.ID, domain.StatusSent)

	botMsg := domain.Message{
		ID:             fmt.Sprintf("m_%d_bot", now.UnixNano()),
		ConversationID: conversationID,
		SenderID:       bot.ID,
		SenderName:     bot.Name,
		SenderAvatar:   bot.Avatar,
		Type:           domain.MsgText,
		Text:           "",
		Timestamp:      now.Add(time.Millisecond).UnixMilli(),
		IsSelf:         false,
	}
	if err := s.convs.AppendMessage(botMsg); err != nil {
		return nil, err
	}

	go s.streamReply(context.Background(), *bot, conversationID, botMsg.ID, userMsg.ID, text)
	return []domain.Message{userMsg, botMsg}, nil
}

// MentionBots：群聊中被 @ 的每个 bot 给出回复。
// userMessageID 是触发本次 @ 的用户消息，用于上下文记录；text 是该消息文本。
// 返回本次生成的占位 bot 消息列表（顺序与 botIDs 对齐）。
func (s *AgentService) MentionBots(conversationID string, userMessageID string, text string, botIDs []string) ([]domain.Message, error) {
	if conversationID == "" || len(botIDs) == 0 {
		return nil, fmt.Errorf("conversationID and botIDs required")
	}
	conv, err := s.convs.GetConversation(conversationID)
	if err != nil {
		return nil, err
	}
	_ = conv

	now := time.Now()
	out := make([]domain.Message, 0, len(botIDs))
	for i, bid := range botIDs {
		bot, err := s.bots.GetBot(bid)
		if err != nil {
			logf("MentionBots: bot %s not found: %v", bid, err)
			continue
		}
		botMsg := domain.Message{
			ID:             fmt.Sprintf("m_%d_%d_bot", now.UnixNano(), i),
			ConversationID: conversationID,
			SenderID:       bot.ID,
			SenderName:     bot.Name,
			SenderAvatar:   bot.Avatar,
			Type:           domain.MsgText,
			Text:           "",
			Timestamp:      now.Add(time.Duration(i+1) * time.Millisecond).UnixMilli(),
			IsSelf:         false,
		}
		if err := s.convs.AppendMessage(botMsg); err != nil {
			logf("MentionBots: append placeholder failed: %v", err)
			continue
		}
		out = append(out, botMsg)
		// 为每个 bot 开一个流式 goroutine（都推同一个事件 topic，前端按 messageId 路由）
		go s.streamReply(context.Background(), *bot, conversationID, botMsg.ID, userMessageID, text)
	}
	return out, nil
}

// streamReply 消费 agent 流式事件并转发到 Wails。
func (s *AgentService) streamReply(
	ctx context.Context,
	bot domain.Bot,
	conversationID, messageID, userMessageID, userText string,
) {
	defer func() {
		if r := recover(); r != nil {
			logf("PANIC in streamReply: %v\n%s", r, debug.Stack())
			if a := application.Get(); a != nil {
				a.Event.Emit("chat:chunk", ChatChunkEvent{
					MessageID:      messageID,
					ConversationID: conversationID,
					Done:           true,
					Error:          fmt.Sprintf("panic: %v", r),
				})
			}
		}
	}()

	app := application.Get()
	if app == nil {
		logf("streamReply: application.Get() returned nil, aborting")
		return
	}
	var full string
	err := s.pool.Chat(ctx, bot, conversationID, userText, func(delta string, done bool) {
		if delta != "" {
			full += delta
		}
		app.Event.Emit("chat:chunk", ChatChunkEvent{
			MessageID:      messageID,
			ConversationID: conversationID,
			Delta:          delta,
			Done:           done,
		})
	})
	if err != nil {
		logf("Chat error: %v", err)
		app.Event.Emit("chat:chunk", ChatChunkEvent{
			MessageID:      messageID,
			ConversationID: conversationID,
			Done:           true,
			Error:          err.Error(),
		})
		return
	}
	logf("streamReply done, full text: %d bytes", len(full))
	if full != "" {
		_ = s.convs.UpdateMessageText(messageID, full)
	}
	// 机器人回复完成后，把触发它的 user 消息标记为已读
	if userMessageID != "" {
		_ = s.convs.UpdateMessageStatus(userMessageID, domain.StatusRead)
		go emitStatus(conversationID, userMessageID, domain.StatusRead)
	}
}

// emitStatus 复用 chat:status 事件，供 AgentService 外部对 user 消息状态流转。
func emitStatus(conversationID, messageID string, status domain.MessageStatus) {
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
