package domain

// Bot 描述一个基于 LLM 派生出的机器人 persona。
// 同一个底层 MiniMax Key 通过不同 SystemPrompt/Instruction 派生出多个"AI 角色"。
type Bot struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
	// 卡片简介（机器人市场展示用）
	Persona string `json:"persona"`
	// 传给 LLM 的角色设定
	SystemPrompt string `json:"systemPrompt"`
	// 用户友好的一句引导语（首次进入聊天时展示）
	Greeting string `json:"greeting"`
	// 生成参数
	Temperature float32 `json:"temperature"`
	MaxTokens   int     `json:"maxTokens"`
	// 是否已安装（已安装机器人出现在联系人列表与会话列表）
	Installed bool `json:"installed"`
	// 用于机器人市场卡片背景色（Tailwind class）
	AccentColor string `json:"accentColor"`
	// 可用工具 ID 列表（空=全部工具；否则只启用列出的 toolset）
	ToolIds []string `json:"toolIds,omitempty"`
}
