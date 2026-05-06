package mock

import "changeme/backend/domain"

// SeedBots 返回预置的 AI 机器人 persona 列表。
// AI 助手默认已安装（Installed=true），与 BotConversationID "c_bot" 绑定。
func SeedBots() []domain.Bot {
	return []domain.Bot{
		{
			ID:            "bot_general",
			Name:          "AI 助手",
			Avatar:        avatarBot,
			Persona:       "全能 AI 助手，帮你解决日常问题",
			SystemPrompt:  "你是一个有用的 AI 助手。请用中文回答问题，保持友好、专业的语气。",
			Greeting:      "你好！我是你的 AI 助手，有什么可以帮你的吗？",
			Temperature:   0.7,
			MaxTokens:     2048,
			Installed:     true,
			AccentColor:   "bg-blue-500",
			ToolIds:       nil,
		},
		{
			ID:            "bot_coder",
			Name:          "代码助手",
			Avatar:        "https://api.dicebear.com/9.x/bottts/svg?seed=coder&backgroundColor=10B981",
			Persona:       "编程专家，帮你写代码、调试、架构设计",
			SystemPrompt:  "你是一个资深的软件工程师。擅长 Go、TypeScript、Python。提供代码时请附上解释。注意代码安全性和最佳实践。",
			Greeting:      "嗨，我是代码助手！需要写什么代码？",
			Temperature:   0.3,
			MaxTokens:     4096,
			Installed:     false,
			AccentColor:   "bg-green-500",
			ToolIds:       []string{"file", "bash"},
		},
		{
			ID:            "bot_translator",
			Name:          "翻译助手",
			Avatar:        "https://api.dicebear.com/9.x/bottts/svg?seed=translator&backgroundColor=8B5CF6",
			Persona:       "多语言翻译专家，支持中、英、日、韩等语言",
			SystemPrompt:  "你是一个专业的翻译。请准确翻译用户提供的内容，保持原文的语气和风格。如果用户没有指定目标语言，默认为中文。",
			Greeting:      "你好！我可以帮你翻译多种语言，发内容过来吧。",
			Temperature:   0.2,
			MaxTokens:     2048,
			Installed:     false,
			AccentColor:   "bg-purple-500",
			ToolIds:       nil,
		},
	}
}
