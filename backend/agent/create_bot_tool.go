package agent

import (
	"context"
	"encoding/json"
	"fmt"

	"changeme/backend/domain"
	"changeme/backend/repository"

	"trpc.group/trpc-go/trpc-agent-go/tool"
)

// CreateBotToolSet 提供一个 create_bot 工具，让 Meta Agent 可以动态创建新机器人。
type CreateBotToolSet struct {
	bots repository.BotRepository
}

// NewCreateBotToolSet 构造 create_bot 工具集。
func NewCreateBotToolSet(bots repository.BotRepository) *CreateBotToolSet {
	return &CreateBotToolSet{bots: bots}
}

func (t *CreateBotToolSet) Name() string { return "create_bot" }

func (t *CreateBotToolSet) Tools(ctx context.Context) []tool.Tool {
	return []tool.Tool{&createBotTool{ts: t}}
}

func (t *CreateBotToolSet) Close() error { return nil }

// createBotTool 实现 tool.CallableTool 接口。
type createBotTool struct {
	ts *CreateBotToolSet
}

func (c *createBotTool) Declaration() *tool.Declaration {
	return &tool.Declaration{
		Name:        "create_bot",
		Description: "创建一个新的 AI 机器人角色。需要提供名称、简介、系统提示和引导语。创建成功后用户可以在机器人市场看到并安装。",
		InputSchema: &tool.Schema{
			Type: "object",
			Properties: map[string]*tool.Schema{
				"name": {
					Type:        "string",
					Description: "机器人名称，简洁好记",
				},
				"persona": {
					Type:        "string",
					Description: "机器人简介，用于市场卡片展示",
				},
				"systemPrompt": {
					Type:        "string",
					Description: "传给 LLM 的角色设定/系统提示",
				},
				"greeting": {
					Type:        "string",
					Description: "用户首次进入聊天时机器人说的引导语",
				},
				"temperature": {
					Type:        "number",
					Description: "生成温度 0.0-1.0，越高越随机（默认0.7）",
				},
				"maxTokens": {
					Type:        "integer",
					Description: "最大生成 token 数（默认2048）",
				},
				"accentColor": {
					Type:        "string",
					Description: "Tailwind 背景色 class，如 bg-purple-500",
				},
			},
			Required: []string{"name", "persona", "systemPrompt", "greeting"},
		},
	}
}

type createBotArgs struct {
	Name         string  `json:"name"`
	Persona      string  `json:"persona"`
	SystemPrompt string  `json:"systemPrompt"`
	Greeting     string  `json:"greeting"`
	Temperature  float32 `json:"temperature"`
	MaxTokens    int     `json:"maxTokens"`
	AccentColor  string  `json:"accentColor"`
}

func (c *createBotTool) Call(ctx context.Context, jsonArgs []byte) (any, error) {
	var args createBotArgs
	if err := json.Unmarshal(jsonArgs, &args); err != nil {
		return nil, fmt.Errorf("create_bot: parse args: %w", err)
	}
	if args.Name == "" || args.Persona == "" || args.SystemPrompt == "" {
		return nil, fmt.Errorf("create_bot: name, persona, systemPrompt are required")
	}
	temp := args.Temperature
	if temp <= 0 {
		temp = 0.7
	}
	maxTok := args.MaxTokens
	if maxTok <= 0 {
		maxTok = 2048
	}
	bot := domain.Bot{
		ID:           fmt.Sprintf("bot_%s", sanitizeName(args.Name)),
		Name:         args.Name,
		Persona:      args.Persona,
		SystemPrompt: args.SystemPrompt,
		Greeting:     args.Greeting,
		Temperature:  temp,
		MaxTokens:    maxTok,
		AccentColor:  args.AccentColor,
		Avatar:       fmt.Sprintf("https://api.dicebear.com/9.x/bottts/svg?seed=%s&backgroundColor=6366f1", sanitizeName(args.Name)),
		Installed:    false,
	}
	// 尝试存入仓库；如果已存在则返回提示
	if existing, _ := c.ts.bots.GetBot(bot.ID); existing != nil {
		return map[string]any{
			"success": false,
			"message": fmt.Sprintf("机器人 %q 已存在（ID: %s），请换一个名称。", args.Name, bot.ID),
		}, nil
	}
	if err := c.ts.bots.AddBot(bot); err != nil {
		return map[string]any{
			"success": false,
			"message": fmt.Sprintf("创建失败: %v", err),
		}, nil
	}
	return map[string]any{
		"success": true,
		"message": fmt.Sprintf("机器人 %q 创建成功！用户可以在机器人市场找到并安装。", args.Name),
		"botId":   bot.ID,
	}, nil
}
