# SWT — AI 聊天助手桌面应用

基于 Wails v3 + React 19 + trpc-agent-go 构建的 AI 聊天应用，支持多 Bot persona、工具调用、暗色模式、会话置顶/静音/删除，可构建 Windows / Android 双平台。

## 技术栈

- **后端**: Go + [trpc-agent-go](https://github.com/trpc-group/trpc-agent-go) (LLM Agent 框架)
- **前端**: React 19 + TypeScript + Tailwind CSS v4 + Zustand
- **桌面框架**: [Wails v3](https://v3.wails.io/) (alpha.76)
- **包管理**: Bun

## 前置要求

| 工具         | 版本   | 说明                                                        |
| ------------ | ------ | ----------------------------------------------------------- |
| Go           | 1.22+  | `go version`                                                |
| Bun          | 1.0+   | `bun --version`                                             |
| Wails v3 CLI | latest | `go install github.com/wailsapp/wails/v3/cmd/wails3@latest` |
| Task         | 3.x+   | [taskfile.dev](https://taskfile.dev)                        |
| Android SDK  | 34+    | 仅 Android 构建需要                                         |
| Android NDK  | r26d   | 仅 Android 构建需要                                         |
| JDK          | 11+    | 仅 Android 构建需要                                         |

## 开发

```bash
# 启动开发模式（热重载）
task dev
# 或
wails3 dev
```

## 构建

### Windows

```bash
task windows:build
```

产物: `bin/swt.exe`

### Android

> ⚠️ `task android:build` 不可用：其 `generate:android:bindings` 步骤用 `-clean=true` 清空 bindings 后，Android CGO 错误导致部分 TS 文件未生成，后续 `build:frontend` 失败。需按以下手动流程构建。

```powershell
# 1. 设置环境变量
$env:ANDROID_HOME="C:\Android\sdk"
$env:ANDROID_NDK_HOME="C:\Android\sdk\ndk\26.1.10909125"

# 2. 先用默认标签恢复 bindings（不要用 -tags android，否则 CGO 错误导致 domain/index.ts 缺失）
wails3 generate bindings -ts -clean=true

# 3. 编译 Go → .so
$env:GOOS="android"; $env:CGO_ENABLED="1"; $env:GOARCH="arm64"
$env:CC="C:\Android\sdk\ndk\26.1.10909125\toolchains\llvm\prebuilt\windows-x86_64\bin\aarch64-linux-android21-clang.cmd"
$env:CXX="C:\Android\sdk\ndk\26.1.10909125\toolchains\llvm\prebuilt\windows-x86_64\bin\aarch64-linux-android21-clang++.cmd"
go build -mod=vendor -buildmode=c-shared -tags android,debug -buildvcs=false -gcflags="all=-l" -o "build\android\app\src\main\jniLibs\arm64-v8a\libwails.so"

# 4. Gradle 打包 APK
cd build\android; .\gradlew.bat assembleDebug

# 5. 复制到 bin/
copy build\android\app\build\outputs\apk\debug\app-debug.apk bin\swt.apk

# 6. 清除环境变量（否则 Windows 构建会失败）
$env:CC=""; $env:CXX=""; $env:GOOS=""; $env:GOARCH=""; $env:CGO_ENABLED=""
```

产物: `bin/swt.apk`

## Vendor 补丁

Wails v3 alpha.76 的 Android 支持不完整，`go mod vendor` 后需手动打 4 个补丁：

### 补丁 1: Android 事件定义

**文件**: `vendor/github.com/wailsapp/wails/v3/pkg/events/events.go`

在 `var iOS = newIOSEvents()` 之前添加：

```go
var Android = newAndroidEvents()

type androidEvents struct {
    ActivityCreated ApplicationEventType
}

func newAndroidEvents() androidEvents {
    return androidEvents{
        ActivityCreated: 1259,
    }
}
```

在事件名映射表末尾添加：

```go
1259: "android:ActivityCreated",
```

### 补丁 2: runtime.Core 调用签名

**文件**: `vendor/github.com/wailsapp/wails/v3/pkg/application/application_android.go`

将 `runtimeJS := runtime.Core()` 改为 `runtimeJS := runtime.Core(nil)`

### 补丁 3: iosMethodNames 存根

**文件**: `vendor/github.com/wailsapp/wails/v3/pkg/application/messageprocessor_android.go`

在 `var androidMethodNames = ...` 之后添加：

```go
// iosMethodNames is empty on Android (iOS methods not available)
var iosMethodNames = map[int]string{}
```

### 补丁 4: build/android main_android.go 修复

**文件**: `build/android/main_android.go`

原文件引用了根包的 `main` 函数，导致 `go test ./...` 在该包失败。需改为注册本地 stub：

```go
//go:build android

package main

import "github.com/wailsapp/wails/v3/pkg/application"

func init() {
	application.RegisterAndroidMain(androidMain)
}

func androidMain() {}
```

> 每次 `go mod vendor` 后补丁 1-3 会被覆盖，需重新应用。补丁 4 在 `build/` 目录下不受 vendor 影响。

## 项目结构

```
swt/
├── backend/
│   ├── agent/          # LLM Agent 集成 (trpc-agent-go)
│   │   ├── agent.go    # Agent 创建、工具注入、<SystemTool> 生成
│   │   ├── config.go   # API Key / Model 配置
│   │   └── pool.go     # Agent 池管理
│   ├── domain/         # 领域模型 (Bot, Conversation, Message, Contact, User)
│   ├── repository/     # 数据访问层 (JSON 持久化 + Mock)
│   ├── services/       # 业务服务 (Bot, Chat, Agent, Contact, Discover, Profile)
│   └── backend.go      # Wails 服务注册入口
├── frontend/
│   ├── src/
│   │   ├── components/ # UI 组件 (layout, conversation, common)
│   │   │   └── conversation/
│   │   │       ├── ConversationMenu.tsx  # 会话操作菜单 (置顶/静音/删除)
│   │   │       ├── BubbleMenu.tsx         # 消息气泡长按菜单 + useLongPress hook
│   │   │       └── MentionPanel.tsx      # @提及候选面板
│   │   ├── hooks/      # React hooks (useBots, useContacts, useConversations)
│   │   ├── lib/        # 工具函数 (cn, botConversation 等)
│   │   ├── pages/      # 页面 (conversations, bots, contacts, discover, profile, search)
│   │   ├── services/   # 前端服务层 (Wails binding + Call.ByName fallback)
│   │   └── types/      # TypeScript 类型定义
│   └── bindings/       # Wails 自动生成的 Go→TS 绑定
├── build/              # 构建配置 (Taskfile, windows, android)
├── docs/               # 构建文档和踩坑记录
├── data/               # JSON 持久化数据目录
└── vendor/             # Go 依赖 (含 Wails v3 补丁)
```

## Agent 工具

每个 Bot 自动拥有以下工具集：

| 工具集        | 工具                                                                                               | 说明             |
| ------------- | -------------------------------------------------------------------------------------------------- | ---------------- |
| **file**      | save_file, read_file, read_multiple_files, list_file, search_file, search_content, replace_content | 文件读写，全权限 |
| **bash**      | exec_command, write_stdin, kill_session                                                            | Shell 命令执行   |
| **fetch-mcp** | 由远端 MCP 提供                                                                                    | 网页抓取 (SSE)   |

工具列表通过 `<SystemTool>` 块自动注入到每个 Bot 的系统提示中，确保 LLM 感知自己的工具能力。

## 会话操作

长按 / 右键会话项可弹出操作菜单，支持：

| 操作   | 后端方法                                         | 说明                     |
| ------ | ------------------------------------------------ | ------------------------ |
| 置顶   | `ChatService.SetPinned`                          | 置顶/取消置顶，排序靠前  |
| 静音   | `ChatService.SetMute`                            | 静音/取消静音，隐藏未读  |
| 删除   | `ChatService.DeleteConversation`                 | 删除会话及全部消息       |

前端通过 `chatService` 统一调用，Wails 环境使用 `Call.ByName`（全限定名 `changeme/backend/services.ChatService.SetPinned` 等），非 Wails 环境回退到 mock 实现。操作后自动触发 `conversationChange` 事件刷新列表和 TabBar 未读数。

## ESLint 配置

`eslint.config.js` 已排除生成文件：
- `bindings/**` — Wails 自动生成的 TS 绑定
- `**/*.d.ts` — 类型声明文件

`BubbleMenu.tsx` 和 `MentionPanel.tsx` 因同时导出组件和 hook/helper，已对 `react-refresh/only-export-components` 规则做定向放宽。

Windows 下 `lint` 脚本使用 `bunx eslint .` 而非 `eslint .`，避免误命中系统 `lint.bat`。

## 文档

- [Android 构建环境](docs/10-android-build-environment.md)
- [Android 构建错误记录](docs/11-android-build-errors-2026-04-18.md)
- [Wails v3 Android 构建修复](docs/12-wails3-android-build-fix.md)
