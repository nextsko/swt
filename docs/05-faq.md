---
tags:
  - wails3
  - faq
  - questions
  - development
aliases:
  - 常见问题
  - FAQ
created: 2026-04-18
updated: 2026-04-18
status: active
---

# 常见问题 (FAQ)

## 🚀 安装和设置

### Q: 如何安装 Wails v3？

```bash
go install github.com/wailsapp/wails/v3/cmd/wails3@latest
```

确保 `$GOPATH/bin` 在你的 PATH 中。

### Q: 如何安装 Bun？

**macOS / Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Q: 为什么选择 Bun 而不是 npm？

- ⚡ **更快** - 安装和运行速度比 npm 快 10-100 倍
- 🔋 **内置功能** - 内置打包器、测试运行器、转译器
- 🎯 **兼容性** - 完全兼容 npm 包
- 💾 **更小** - 磁盘占用更少

## 🔧 开发问题

### Q: TypeScript 找不到绑定模块怎么办？

**错误信息：**

```text
Cannot find module '../bindings/changeme'
```

**解决方案：**
```bash
# 重新生成 TypeScript 绑定
wails3 generate bindings -ts

# 或者重新构建项目
wails3 build
```

### Q: 如何添加新的 Go 服务？

1. 创建服务文件：
```go
// myservice.go
package main

type MyService struct{}

func NewMyService() *MyService {
    return &MyService{}
}

func (s *MyService) MyMethod(input string) string {
    return "Result: " + input
}
```

2. 注册服务：
```go
// main.go
Services: []application.Service{
    application.NewService(NewGreetService()),
    application.NewService(NewMyService()),
},
```

3. 重新构建生成绑定：
```bash
wails3 build
```

### Q: 如何在前端调用 Go 方法？

```typescript
import { MyService } from '../bindings/changeme'

// 调用方法
const result = await MyService.MyMethod("input")
```

### Q: 热重载不工作怎么办？

**检查清单：**
- [ ] 确认使用 `wails3 dev` 启动
- [ ] 检查前端 Vite 服务器是否正常运行
- [ ] 查看终端是否有错误信息
- [ ] 尝试重启开发服务器

### Q: 如何调试前端代码？

1. 在 `wails3 dev` 模式下运行
2. 打开浏览器开发者工具（F12）
3. 使用 `console.log()` 输出调试信息
4. 在 Sources 面板设置断点

### Q: 如何调试 Go 代码？

使用 Go 调试器（Delve）：

```bash
# 安装 Delve
go install github.com/go-delve/delve/cmd/dlv@latest

# 调试模式运行
dlv debug
```

## 🎨 UI 和样式

### Q: 如何自定义 Tailwind CSS 配置？

Tailwind CSS v4 不需要配置文件！直接在 CSS 中使用：

```css
/* frontend/src/index.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --font-family-display: "Inter", sans-serif;
}
```

### Q: 如何添加自定义字体？

1. 将字体文件放在 `frontend/public/fonts/`
2. 在 CSS 中引入：

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/CustomFont.woff2') format('woff2');
}

body {
  font-family: 'CustomFont', sans-serif;
}
```

### Q: 如何更改应用图标？

1. 替换 `build/appicon.png`（至少 512x512）
2. 重新生成图标：

```bash
wails3 generate icons -input build/appicon.png
```

## 🖥️ 系统托盘

### Q: 系统托盘图标不显示？

**Windows:**
- 检查 `build/windows/icon.ico` 是否存在
- 确认图标格式正确（ICO 格式）

**macOS:**
- 检查 `build/darwin/icons.icns` 是否存在
- 使用模板图标：`systemTray.SetTemplateIcon(icons.SystrayMacTemplate)`

**Linux:**
- 检查系统托盘支持（某些桌面环境可能不支持）

### Q: 如何自定义托盘菜单？

```go
myMenu := app.Menu.New()
myMenu.Add("Custom Item").OnClick(func(_ *application.Context) {
    // 处理点击
})
myMenu.AddSeparator()
myMenu.Add("Quit").OnClick(func(_ *application.Context) {
    app.Quit()
})
systemTray.SetMenu(myMenu)
```

### Q: 退出功能不工作？

确保：

1. **Go 后端有退出信号处理：**
```go
var quitSignal = make(chan bool)

func (g *GreetService) QuitApp() {
    quitSignal <- true
}

// 在 main 中监听
go func() {
    <-quitSignal
    app.Quit()
}()
```

2. **Windows 配置：**
```go
Windows: application.WindowsOptions{
    DisableQuitOnLastWindowClosed: true,
},
```

## 📦 构建和打包

### Q: 如何构建生产版本？

```bash
wails3 build
```

可执行文件位于 `bin/` 目录。

### Q: 如何减小应用体积？

1. **启用 UPX 压缩：**
```bash
wails3 build -upx
```

2. **使用生产构建标志：**
```bash
wails3 build -tags production
```

3. **移除调试信息：**
```bash
wails3 build -ldflags="-s -w"
```

### Q: 如何打包为安装程序？

**Windows (NSIS):**
```bash
wails3 package -platform windows/amd64 -nsis
```

**macOS (DMG):**
```bash
wails3 package -platform darwin/universal
```

**Linux (AppImage/DEB/RPM):**
```bash
wails3 package -platform linux/amd64 -appimage
wails3 package -platform linux/amd64 -deb
wails3 package -platform linux/amd64 -rpm
```

### Q: 如何交叉编译？

```bash
# 为 Windows 构建（从 macOS/Linux）
wails3 build -platform windows/amd64

# 为 macOS 构建（从 Windows/Linux）
wails3 build -platform darwin/universal

# 为 Linux 构建（从 Windows/macOS）
wails3 build -platform linux/amd64
```

## 🔐 安全和权限

### Q: 如何处理敏感数据？

- 使用环境变量存储密钥
- 不要在代码中硬编码密码
- 使用系统密钥链（keychain/credential manager）

### Q: 如何请求管理员权限？

**Windows:**
在 `build/windows/wails.exe.manifest` 中设置：
```xml
<requestedExecutionLevel level="requireAdministrator" />
```

**macOS:**
使用 `osascript` 提示用户输入密码

**Linux:**
使用 `pkexec` 或 `sudo`

## 🌐 网络和 API

### Q: 如何在 Go 中发起 HTTP 请求？

```go
import "net/http"

func (s *MyService) FetchData(url string) (string, error) {
    resp, err := http.Get(url)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    return string(body), err
}
```

### Q: 如何处理 CORS？

Wails 应用不受 CORS 限制，因为前端和后端在同一进程中运行。

## 📱 多平台支持

### Q: 如何检测当前平台？

```go
import "runtime"

func (s *MyService) GetPlatform() string {
    return runtime.GOOS // "windows", "darwin", "linux"
}
```

### Q: 如何编写平台特定代码？

使用构建标签：

```go
//go:build windows
// +build windows

package main

func platformSpecific() {
    // Windows 特定代码
}
```

```go
//go:build darwin
// +build darwin

package main

func platformSpecific() {
    // macOS 特定代码
}
```

## 🔄 更新和迁移

### Q: 如何更新 Wails 版本？

```bash
go install github.com/wailsapp/wails/v3/cmd/wails3@latest
```

### Q: 如何更新前端依赖？

```bash
cd frontend
bun update
```

### Q: 如何从 Wails v2 迁移？

参考官方迁移指南：
https://v3.wails.io/migration/v2-to-v3/

## 💡 性能优化

### Q: 如何提升应用启动速度？

1. 减少初始化时的同步操作
2. 延迟加载非关键资源
3. 使用生产构建
4. 启用代码分割

### Q: 如何优化内存使用？

1. 及时释放不用的资源
2. 避免内存泄漏（特别是事件监听器）
3. 使用对象池复用对象
4. 定期进行垃圾回收

## 📚 更多资源

- 📖 [Wails v3 文档](https://v3.wails.io/)
- 💬 [Wails Discord](https://discord.gg/JDdSxwjhGf)
- 🐙 [Wails GitHub](https://github.com/wailsapp/wails)
- 📝 [踩坑记录](./PITFALLS.md)
- 🔧 [扩展指南](./EXTENDING.md)
- 💎 [最佳实践](./BEST_PRACTICES.md)

---

**还有其他问题？** 加入 [Wails Discord](https://discord.gg/JDdSxwjhGf) 社区寻求帮助！
