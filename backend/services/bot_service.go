package services

import (
	"fmt"

	"changeme/backend/domain"
	"changeme/backend/repository"
)

// BotService 暴露给前端的 bot 查询/安装 API。
type BotService struct {
	bots  repository.BotRepository
	convs repository.ConversationRepository
	self  repository.ProfileRepository
	pool  AgentPoolInvalidator
}

// AgentPoolInvalidator 使指定 bot 的 Agent 缓存失效（由 AgentService 实现）。
type AgentPoolInvalidator interface {
	InvalidatePool(botID string)
}

func NewBotService(
	bots repository.BotRepository,
	convs repository.ConversationRepository,
	self repository.ProfileRepository,
) *BotService {
	return &BotService{bots: bots, convs: convs, self: self}
}

// SetPoolInvalidator 注入 AgentService 的 Pool，使工具配置变更后 Agent 重建。
func (s *BotService) SetPoolInvalidator(p AgentPoolInvalidator) {
	s.pool = p
}

// ListBots 返回全部机器人（用于机器人市场）。
func (s *BotService) ListBots() ([]domain.Bot, error) { return s.bots.ListBots() }

// ListInstalled 已安装机器人（联系人 Tab 与 @ 面板用）。
func (s *BotService) ListInstalled() ([]domain.Bot, error) { return s.bots.ListInstalled() }

// GetBot 查单个 bot 信息。
func (s *BotService) GetBot(id string) (*domain.Bot, error) { return s.bots.GetBot(id) }

// InstallBot 安装机器人并确保存在一个绑定的单聊会话。返回该会话。
func (s *BotService) InstallBot(id string) (*domain.Conversation, error) {
	if id == "" {
		return nil, fmt.Errorf("bot id is required")
	}
	if err := s.bots.SetInstalled(id, true); err != nil {
		return nil, err
	}
	bot, err := s.bots.GetBot(id)
	if err != nil {
		return nil, err
	}
	self, err := s.self.GetCurrentUser()
	if err != nil {
		return nil, err
	}
	return s.convs.UpsertBotConversation(*bot, self.ID)
}

// UninstallBot 从联系人/会话中移除机器人（会话本身不删，只标记 bot 未安装；重新安装时会复用）。
func (s *BotService) UninstallBot(id string) error {
	return s.bots.SetInstalled(id, false)
}

// SetToolIds 配置机器人可用工具。空列表 = 全部工具。
func (s *BotService) SetToolIds(id string, toolIds []string) error {
	if err := s.bots.SetToolIds(id, toolIds); err != nil {
		return err
	}
	if s.pool != nil {
		s.pool.InvalidatePool(id)
	}
	return nil
}
