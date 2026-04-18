// Package agent 封装对 trpc-agent-go 的集成，提供一个简单的流式聊天接口。
// 外部调用方只需通过 Chat(ctx, userMsg, onChunk) 即可获得流式 token。
package agent

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"changeme/backend/domain"

	"trpc.group/trpc-go/trpc-agent-go/agent"
	"trpc.group/trpc-go/trpc-agent-go/agent/llmagent"
	"trpc.group/trpc-go/trpc-agent-go/model"
	"trpc.group/trpc-go/trpc-agent-go/model/openai"
	"trpc.group/trpc-go/trpc-agent-go/runner"
	sessioninmemory "trpc.group/trpc-go/trpc-agent-go/session/inmemory"
)

const (
	appName = "swt-chat"
)

// Agent 维护一个可复用的 Runner。支持多 session（多聊天上下文）。
type Agent struct {
	cfg    Config
	runner runner.Runner
	userID string
	// 默认 session ID（无上下文时使用），兼容旧 Chat()
	defaultSession string
}

// NewFromBot 基于 Bot persona 构造 Agent（派生不同系统提示与生成参数）。
func NewFromBot(cfg Config, bot domain.Bot) (*Agent, error) {
	if !cfg.IsConfigured() {
		return nil, fmt.Errorf("agent: missing API key")
	}
	modelInstance := openai.New(cfg.Model,
		openai.WithAPIKey(cfg.APIKey),
		openai.WithBaseURL(cfg.BaseURL),
	)
	maxTok := bot.MaxTokens
	if maxTok <= 0 {
		maxTok = 2048
	}
	temp := float64(bot.Temperature)
	if temp <= 0 {
		temp = 0.7
	}
	description := bot.Persona
	if description == "" {
		description = "A helpful assistant."
	}
	instruction := bot.SystemPrompt
	if instruction == "" {
		instruction = "回答请使用 Markdown 格式，保持简洁。"
	}
	llmAgent := llmagent.New(
		sanitizeName(bot.ID),
		llmagent.WithModel(modelInstance),
		llmagent.WithDescription(description),
		llmagent.WithInstruction(instruction),
		llmagent.WithGenerationConfig(model.GenerationConfig{
			MaxTokens:   intPtr(maxTok),
			Temperature: floatPtr(temp),
			Stream:      true,
		}),
	)
	sess := sessioninmemory.NewSessionService()
	r := runner.NewRunner(appName, llmAgent, runner.WithSessionService(sess))
	return &Agent{
		cfg:            cfg,
		runner:         r,
		userID:         "local-user",
		defaultSession: bot.ID + ":default",
	}, nil
}

// New 保留旧签名，使用 "AI 助手"默认 persona 构造。仅为兼容老代码。
func New(cfg Config) (*Agent, error) {
	return NewFromBot(cfg, domain.Bot{
		ID:           "legacy-assistant",
		Name:         "AI 助手",
		Persona:      "A helpful AI assistant.",
		SystemPrompt: "回答请使用 Markdown 格式。代码块使用 ``` 包裹。保持回答简洁、直接。",
		Temperature:  0.7,
		MaxTokens:    2048,
	})
}

// sanitizeName 去除 ID 里 LLM agent name 不允许的字符。
func sanitizeName(id string) string {
	out := make([]byte, 0, len(id))
	for i := 0; i < len(id); i++ {
		c := id[i]
		if c == '-' || c == '_' || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') {
			out = append(out, c)
		} else {
			out = append(out, '_')
		}
	}
	if len(out) == 0 {
		return "assistant"
	}
	return string(out)
}

// Close 释放 Runner 持有的资源。
func (a *Agent) Close() {
	if a != nil && a.runner != nil {
		_ = a.runner.Close()
	}
}

// Chat 兼容旧入口，使用默认 session。
func (a *Agent) Chat(ctx context.Context, userMessage string, onChunk func(delta string, done bool)) error {
	return a.ChatSession(ctx, a.defaultSession, userMessage, onChunk)
}

// ChatSession 在指定 sessionID（如 conversationID）下流式对话。
func (a *Agent) ChatSession(
	ctx context.Context,
	sessionID, userMessage string,
	onChunk func(delta string, done bool),
) error {
	if a == nil {
		return fmt.Errorf("agent not initialized")
	}
	if sessionID == "" {
		sessionID = a.defaultSession
	}
	println(fmt.Sprintf("[agent] Chat start: session=%s model=%s user=%q", sessionID, a.cfg.Model, userMessage))
	msg := model.NewUserMessage(userMessage)
	reqID := uuid.New().String()

	events, err := a.runner.Run(ctx, a.userID, sessionID, msg, agent.WithRequestID(reqID))
	if err != nil {
		println(fmt.Sprintf("[agent] runner.Run failed: %v", err))
		return fmt.Errorf("runner.Run: %w", err)
	}

	chunkCount := 0
	for evt := range events {
		if evt.Error != nil {
			println(fmt.Sprintf("[agent] event error: %s", evt.Error.Message))
			return fmt.Errorf("agent error: %s", evt.Error.Message)
		}
		if evt.Response != nil && len(evt.Response.Choices) > 0 {
			delta := evt.Response.Choices[0].Delta.Content
			if delta != "" {
				chunkCount++
				onChunk(delta, false)
			}
		}
		if evt.IsFinalResponse() {
			println(fmt.Sprintf("[agent] final response received after %d chunks", chunkCount))
			onChunk("", true)
			break
		}
	}
	return nil
}

func intPtr(v int) *int           { return &v }
func floatPtr(v float64) *float64 { return &v }
