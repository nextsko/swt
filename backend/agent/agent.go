// Package agent 封装对 trpc-agent-go 的集成，提供一个简单的流式聊天接口。
// 外部调用方只需通过 Chat(ctx, userMsg, onChunk) 即可获得流式 token。
package agent

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"

	"changeme/backend/domain"

	"trpc.group/trpc-go/trpc-agent-go/agent"
	"trpc.group/trpc-go/trpc-agent-go/agent/llmagent"
	"trpc.group/trpc-go/trpc-agent-go/model"
	"trpc.group/trpc-go/trpc-agent-go/model/openai"
	"trpc.group/trpc-go/trpc-agent-go/runner"
	sessioninmemory "trpc.group/trpc-go/trpc-agent-go/session/inmemory"
	"trpc.group/trpc-go/trpc-agent-go/tool"
	filetool "trpc.group/trpc-go/trpc-agent-go/tool/file"
	hostexectool "trpc.group/trpc-go/trpc-agent-go/tool/hostexec"
	mcptool "trpc.group/trpc-go/trpc-agent-go/tool/mcp"
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
	// 所有 toolset 在 Close 时统一清理
	toolSets []tool.ToolSet
}

// NewFromBot 基于 Bot persona 构造 Agent（派生不同系统提示与生成参数）。
// createBotTS 可选：非 nil 时，若 bot.ID 为 "bot_creator" 则注入 create_bot 工具。
func NewFromBot(cfg Config, bot domain.Bot, createBotTS *CreateBotToolSet) (*Agent, error) {
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
	// --- File ToolSet: 全权限开放 ---
	workDir, _ := os.Getwd()
	fileTS, err := filetool.NewToolSet(
		filetool.WithBaseDir(workDir),
		filetool.WithSaveFileEnabled(true),
		filetool.WithReadFileEnabled(true),
		filetool.WithReadMultipleFilesEnabled(true),
		filetool.WithListFileEnabled(true),
		filetool.WithSearchFileEnabled(true),
		filetool.WithSearchContentEnabled(true),
		filetool.WithReplaceContentEnabled(true),
		filetool.WithMaxFileSize(10*1024*1024), // 10MB
	)
	if err != nil {
		return nil, fmt.Errorf("agent: failed to create file toolset: %w", err)
	}

	// --- HostExec ToolSet: Bash 命令执行 ---
	hostExecTS, err := hostexectool.NewToolSet(
		hostexectool.WithBaseDir(workDir),
		hostexectool.WithName("bash"),
		hostexectool.WithJobTTL(5*time.Minute),
	)
	if err != nil {
		return nil, fmt.Errorf("agent: failed to create hostexec toolset: %w", err)
	}

	// --- SSE MCP ToolSet: fetch-mcp ---
	fetchMCP := mcptool.NewMCPToolSet(
		mcptool.ConnectionConfig{
			Transport: "sse",
			ServerURL: "https://fetch-mcp.nextcore.work/mcp",
			Timeout:   30 * time.Second,
		},
		mcptool.WithName("fetch-mcp"),
		mcptool.WithSessionReconnect(3),
	)
	if initErr := fetchMCP.Init(context.Background()); initErr != nil {
		fmt.Printf("[agent] WARN: fetch-mcp init failed: %v\n", initErr)
	} else {
		fmt.Println("[agent] fetch-mcp SSE toolset initialized")
	}

	// --- 收集所有 ToolSet ---
	allToolSets := []tool.ToolSet{fileTS, hostExecTS, fetchMCP}

	// --- Meta Agent: 造物主机器人注入 create_bot 工具 ---
	if createBotTS != nil && bot.ID == "bot_creator" {
		allToolSets = append(allToolSets, createBotTS)
	}

	// --- 根据 bot.ToolIds 过滤：空=全部，否则只保留匹配的 ---
	activeToolSets := filterToolSets(allToolSets, bot.ToolIds)

	// --- 构建 <SystemTool> 工具清单，注入 instruction ---
	instruction = buildSystemToolInstruction(instruction, activeToolSets)

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
		llmagent.WithToolSets(activeToolSets),
	)
	sess := sessioninmemory.NewSessionService()
	r := runner.NewRunner(appName, llmAgent, runner.WithSessionService(sess))
	return &Agent{
		cfg:            cfg,
		runner:         r,
		userID:         "local-user",
		defaultSession: bot.ID + ":default",
		toolSets:       activeToolSets,
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
	}, nil)
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

// Close 释放 Runner 和所有 ToolSet 持有的资源。
func (a *Agent) Close() {
	if a != nil {
		for _, ts := range a.toolSets {
			_ = ts.Close()
		}
		if a.runner != nil {
			_ = a.runner.Close()
		}
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

// filterToolSets 根据 bot.ToolIds 过滤工具集。
// 空 toolIds = 全部启用；否则只保留 Name 匹配的 toolset。
func filterToolSets(all []tool.ToolSet, toolIds []string) []tool.ToolSet {
	if len(toolIds) == 0 {
		return all
	}
	allowed := make(map[string]bool, len(toolIds))
	for _, id := range toolIds {
		allowed[id] = true
	}
	var out []tool.ToolSet
	for _, ts := range all {
		if allowed[ts.Name()] {
			out = append(out, ts)
		}
	}
	return out
}

// buildSystemToolInstruction 在 instruction 末尾追加 <SystemTool> 块，
// 列出所有可用工具的名称和用途，帮助 LLM 感知自己的工具能力。
func buildSystemToolInstruction(baseInstruction string, toolSets []tool.ToolSet) string {
	var b strings.Builder
	b.WriteString(baseInstruction)
	b.WriteString("\n\n<SystemTool>\n你可以使用以下工具来完成任务，请在需要时主动调用：\n")

	for _, ts := range toolSets {
		tools := ts.Tools(context.Background())
		if len(tools) == 0 {
			continue
		}
		b.WriteString(fmt.Sprintf("\n## %s\n", ts.Name()))
		for _, t := range tools {
			d := t.Declaration()
			if d == nil {
				continue
			}
			desc := d.Description
			if len(desc) > 120 {
				desc = desc[:120] + "..."
			}
			b.WriteString(fmt.Sprintf("- **%s**: %s\n", d.Name, desc))
		}
	}

	b.WriteString("</SystemTool>")
	return b.String()
}
