---
tags:
  - wails3
  - react
  - chat
  - phase-b
  - interactions
aliases:
  - 聊天交互阶段 B
  - 聊天高级功能实现
created: 2026-04-18
updated: 2026-04-18
status: active
---

> [!abstract] 概述
> 阶段 B 在阶段 A 的基础上补齐聊天页高级交互：全局搜索、气泡长按菜单（复制/引用/转发/撤回/删除）、表情面板、群成员管理、AI 打字指示器、草稿持久化闭环。后端扩展 `RecallMessage` / `DeleteMessage`，前端完成并构建 APK 到真机。

## 操作流程

### 1. 全局搜索页

- 新增 `frontend/src/pages/search/GlobalSearchPage.tsx`
- 覆盖四类匹配：联系人 / 群聊 / 机器人 / 消息
- 路由 `/search`，由信息页顶栏放大镜图标进入

### 2. 气泡长按菜单 BubbleMenu

- 新增 `frontend/src/components/conversation/BubbleMenu.tsx`
- 暴露 `useLongPress(onTrigger, delay=500ms)` Hook
- 使用 `createPortal` 渲染到 body，遮罩点击或 Esc 关闭
- 菜单项：复制 / 引用 / 转发 / 撤回（仅自己）/ 删除
- `ChatBubble` 增加 `onLongPress(message, rect)` 回调，绑定 pointer 事件
- `ChatDetailPage` 聚合：
  - 复制 → `navigator.clipboard.writeText`
  - 引用 → 设置 quote state，顶部预览
  - 撤回 → `recallMessage()`
  - 删除 → `deleteMessage()`

### 3. EmojiPanel 表情面板

- 新增 `frontend/src/components/conversation/EmojiPanel.tsx`
- 6 分类 × 24 表情（Unicode 转义 `\u{XXXX}` 避免编码问题）
- `ChatComposer` 集成：emoji 按钮 toggle → 插入到当前光标位置 → 退格按钮删除最后字符

### 4. GroupMembersPage 群成员

- 新增 `frontend/src/pages/conversations/GroupMembersPage.tsx`
- 5 列成员网格，owner 徽章 / bot 徽章
- owner 点击"管理"进入移除模式，非自己/非 owner 出现红色减号
- 路由 `/group/:id/members`，ChatDetailPage 头部右按钮跳转

### 5. TypingIndicator 打字指示

- 新增 `frontend/src/components/conversation/TypingIndicator.tsx`
- 三点呼吸动画，`@keyframes typing-bounce` 写入 `index.css`
- 触发条件：`streaming === true` 且最后一条 bot 气泡 text 为空

### 6. 草稿持久化闭环

- `ChatComposer` 新增 `initialValue` / `onDraftChange`
- 用 ref 跟踪最新 value，卸载时保存最新值（避免闭包旧值）
- `ChatDetailPage` 传入 `conversation.draft` 初始化、`chatService.setDraft` 持久化
- `ConversationItem` 原有 `[草稿]` 渲染逻辑打通

### 7. 后端扩展

- `backend/repository/repository.go` 接口增 `RecallMessage` / `DeleteMessage`
- `backend/repository/mock_impl.go` 实现：
  - `RecallMessage` 将消息改成 tip 类型"XX 撤回了一条消息"
  - `DeleteMessage` 物理删除，回填 lastMessage
  - 工具函数 `lastMessagePreview(m domain.Message) string`
- `backend/services/chat_service.go` 透传
- 重新运行 `wails3 generate bindings -ts -clean=true`

### 8. 前端 chatService 包装

- `recallMessage(messageId)` 带 mock fallback
- `deleteMessage(messageId)` 带 mock fallback
- `setDraft(conversationId, draft)` 带 mock fallback
- `useChat` hook 暴露 `recallMessage` / `deleteMessage`

### 9. APK 构建与部署

- `bun run build` → 1.23 MB（gzip 357 KB）
- `task android:compile:go:shared ARCH=arm64` → `libwails.so` 38.57 MB
- `build/android/gradlew.bat assembleDebug` → `app-debug.apk`
- 复制到 `bin/swt.apk`（34.97 MB）
- `adb install -r bin\swt.apk` 成功
- `adb shell am start -n com.wails.app/.MainActivity` 启动验证

## 关键踩坑

### tsc 增量编译缓存

> [!warning] tsc -b 可能报已过时的错误
> 使用 `tsc -b --force` 有时仍返回旧缓存结果；切换到 `tsc --noEmit -p tsconfig.app.json` 即可获得真实状态。
> 彻底清缓存：`Get-ChildItem -Recurse -Filter "*.tsbuildinfo" | Remove-Item -Force`

### Emoji 编码问题

> [!tip] 直接写 emoji 字符会导致 write_to_file 协议 EOF
> 必须用 JS Unicode 转义：`'\u{1F600}'`、`'\u2764\uFE0F'`；组合修饰符 VS16 用 `\uFE0F`。

### Task 在 Windows 运行 Android 构建

> [!warning] `wails3 task android:build` 报 mkdir not found
> 用 `task android:compile:go:shared ARCH=arm64` + `gradlew.bat assembleDebug` 分步执行即可。
> 需先设置 `$env:ANDROID_HOME` / `$env:ANDROID_NDK_HOME` / PATH。

### MIUI 拦截 adb input

> [!info] MIUI 禁止 adb shell input tap/keyevent
> 错误：`java.lang.SecurityException: Injecting input events requires INJECT_EVENTS permission`
> 只能手动操作设备，screencap 仍可用。

## 代码片段

### useLongPress Hook

```tsx
export function useLongPress(onTrigger: (rect: DOMRect) => void, delay = 500) {
    const timerRef = useRef<number | null>(null)
    const targetRef = useRef<HTMLElement | null>(null)

    const start = (el: HTMLElement) => {
        targetRef.current = el
        if (timerRef.current) window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => {
            if (targetRef.current) {
                onTrigger(targetRef.current.getBoundingClientRect())
            }
        }, delay)
    }
    const cancel = () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    return {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return
            start(e.currentTarget)
        },
        onPointerUp: cancel,
        onPointerLeave: cancel,
        onPointerCancel: cancel,
        onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault()
            onTrigger(e.currentTarget.getBoundingClientRect())
        },
    }
}
```

### Typing 动画 CSS

```css
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
  30% { transform: translateY(-3px); opacity: 1; }
}
.animate-typing {
  animation: typing-bounce 1.1s infinite ease-in-out;
}
```

### 草稿 ref 保留最新值

```tsx
const latestRef = useRef<{ value: string; save?: (d: string) => void }>({ value: '' })
latestRef.current.value = value
latestRef.current.save = onDraftChange
useEffect(() => {
    return () => {
        latestRef.current.save?.(latestRef.current.value)
    }
}, [])
```

### 撤回消息（Go）

```go
func (s *MockStore) RecallMessage(messageID string) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    for convID, msgs := range s.messages {
        for i, m := range msgs {
            if m.ID == messageID {
                name := m.SenderName
                if name == "" {
                    name = "成员"
                }
                s.messages[convID][i] = domain.Message{
                    ID:             m.ID,
                    ConversationID: m.ConversationID,
                    Type:           domain.MsgTip,
                    Text:           fmt.Sprintf("%s 撤回了一条消息", name),
                    Timestamp:      m.Timestamp,
                }
                for k, c := range s.conversations {
                    if c.ID == convID {
                        s.conversations[k].LastMessage = fmt.Sprintf("%s 撤回了一条消息", name)
                        break
                    }
                }
                s.markDirty()
                return nil
            }
        }
    }
    return fmt.Errorf("message not found: %s", messageID)
}
```

### Windows PowerShell 构建 APK

```powershell
# 环境变量
$env:ANDROID_HOME="C:\Android\sdk"
$env:ANDROID_NDK_HOME="C:\Android\sdk\ndk\26.1.10909125"
$env:PATH="C:\Android\sdk\cmdline-tools\latest\bin;C:\Android\sdk\platform-tools;$env:PATH"

# 前端
cd frontend
bun run build
cd ..

# Go shared library
task android:compile:go:shared ARCH=arm64

# APK
cd build/android
.\gradlew.bat assembleDebug
cd ../..

# 复制与安装
Copy-Item build\android\app\build\outputs\apk\debug\app-debug.apk bin\swt.apk -Force
adb install -r bin\swt.apk
adb shell am start -n com.wails.app/.MainActivity
```

## 产出文件

### 新增组件

- `frontend/src/components/conversation/BubbleMenu.tsx`
- `frontend/src/components/conversation/EmojiPanel.tsx`
- `frontend/src/components/conversation/TypingIndicator.tsx`

### 新增页面

- `frontend/src/pages/search/GlobalSearchPage.tsx`
- `frontend/src/pages/conversations/GroupMembersPage.tsx`

### 扩展文件

- `backend/repository/repository.go` — 接口增方法
- `backend/repository/mock_impl.go` — 实现 + `lastMessagePreview`
- `backend/services/chat_service.go` — 透传
- `frontend/src/services/chatService.ts` — recall / delete / setDraft 包装
- `frontend/src/hooks/useConversations.ts` — useChat 暴露新方法
- `frontend/src/components/conversation/ChatBubble.tsx` — onLongPress
- `frontend/src/components/conversation/ChatComposer.tsx` — emoji 面板 + 草稿
- `frontend/src/pages/conversations/ChatDetailPage.tsx` — 聚合所有交互
- `frontend/src/components/conversation/ConversationItem.tsx` — 已有草稿渲染
- `frontend/src/router.tsx` — 新增路由
- `frontend/src/index.css` — typing 动画

## 相关笔记

- [[12-wails3-android-build-fix]] — Android APK 构建流程
- [[10-android-build-environment]] — 环境变量与 SDK 配置
- [[04-pitfalls]] — 项目踩坑总集
