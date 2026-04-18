package agent

import (
	"os"
	"strings"
)

// Config 持有调用 LLM 所需的最小配置。
type Config struct {
	APIKey   string // 提供给 OpenAI 兼容 SDK 作为 Authorization: Bearer
	BaseURL  string // OpenAI 兼容端点根路径，例如 https://api.minimaxi.com/v1
	Model    string // 模型名称，例如 MiniMax-M2.7-highspeed
	Provider string // 标签位，默认 "openai" 表示使用 OpenAI 兼容协议
}

// 默认 MiniMax 配置。真实 Key 由 env 或构建注入覆盖，避免将生产密钥写死到仓库。
// 当前值仅用于本地原型演示，方便首次运行即通；生产请通过 MINIMAX_API_KEY 等环境变量注入。
const (
	defaultBaseURL = "https://api.minimaxi.com/v1"
	defaultModel   = "MiniMax-M2.7-highspeed"
)

// builtinAPIKey 允许通过 -ldflags="-X changeme/backend/agent.builtinAPIKey=..." 构建期注入。
// 默认值为原型演示用 Key；生产应通过 MINIMAX_API_KEY 环境变量覆盖。
var builtinAPIKey = "sk-cp-iaT6G4JY0diGx4qSA1NNxDhkDT0nZrU1yT9X6GpJs83A46Af1igsvPWaxm4Ca1-2OoGsZt4LRYgPXnA-I-8Bh-M8gWeFKNZV3rMptlQrzylrMUXTBP_Ky5k"

// LoadConfig 以 env > builtin > default 的优先级构建 Config。
// 任何环境变量缺失都会回退到 builtinAPIKey / 默认值。
func LoadConfig() Config {
	return Config{
		APIKey:   firstNonEmpty(os.Getenv("MINIMAX_API_KEY"), os.Getenv("OPENAI_API_KEY"), builtinAPIKey),
		BaseURL:  firstNonEmpty(os.Getenv("MINIMAX_API_HOST"), os.Getenv("OPENAI_BASE_URL"), defaultBaseURL),
		Model:    firstNonEmpty(os.Getenv("MINIMAX_MODEL"), os.Getenv("OPENAI_MODEL"), defaultModel),
		Provider: firstNonEmpty(os.Getenv("AGENT_PROVIDER"), "openai"),
	}
}

// IsConfigured 返回 APIKey 是否存在（没有 key 时 agent 无法调用远端 LLM）。
func (c Config) IsConfigured() bool {
	return strings.TrimSpace(c.APIKey) != ""
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}
