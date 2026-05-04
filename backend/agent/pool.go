package agent

import (
	"context"
	"fmt"
	"sync"

	"changeme/backend/domain"
)

// Pool 按 bot ID 懒加载并复用 Agent 实例。
// 相同 MiniMax Key 下以不同 SystemPrompt/Temperature/MaxTokens 派生多个角色。
type Pool struct {
	mu          sync.Mutex
	cfg         Config
	bots        map[string]*Agent
	createBotTS *CreateBotToolSet // 可选：Meta Agent 专用的 create_bot 工具集
}

func NewPool(cfg Config) *Pool {
	return &Pool{cfg: cfg, bots: map[string]*Agent{}}
}

// SetCreateBotToolSet 注入 create_bot 工具集，使 Meta Agent 可以动态创建机器人。
func (p *Pool) SetCreateBotToolSet(ts *CreateBotToolSet) {
	p.createBotTS = ts
}

func (p *Pool) Ready() bool { return p.cfg.IsConfigured() }

// GetOrInit 返回指定 bot 的 Agent；首次调用时构造。
func (p *Pool) GetOrInit(bot domain.Bot) (*Agent, error) {
	if !p.cfg.IsConfigured() {
		return nil, fmt.Errorf("agent pool: missing API key")
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	if a, ok := p.bots[bot.ID]; ok && a != nil {
		return a, nil
	}
	a, err := NewFromBot(p.cfg, bot, p.createBotTS)
	if err != nil {
		return nil, err
	}
	p.bots[bot.ID] = a
	return a, nil
}

// Chat 代理调用。sessionID 用于区分同 bot 的不同聊天上下文。
func (p *Pool) Chat(ctx context.Context, bot domain.Bot, sessionID, userText string, onChunk func(string, bool)) error {
	a, err := p.GetOrInit(bot)
	if err != nil {
		return err
	}
	return a.ChatSession(ctx, sessionID, userText, onChunk)
}

// Close 释放所有底层 runner 和 MCP toolset。
func (p *Pool) Close() {
	p.mu.Lock()
	defer p.mu.Unlock()
	for _, a := range p.bots {
		a.Close()
	}
	p.bots = map[string]*Agent{}
}

// Invalidate 使指定 bot 的缓存 Agent 失效，下次 Chat 时会以新配置重建。
func (p *Pool) Invalidate(botID string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if a, ok := p.bots[botID]; ok {
		a.Close()
		delete(p.bots, botID)
	}
}
