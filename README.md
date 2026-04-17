# Wails3 React TypeScript Tailwind Bun Template

> 🚀 一个现代化的 Wails v3 应用模板，集成 React 19、TypeScript、Tailwind CSS v4 和 Bun 包管理器

[![Wails](https://img.shields.io/badge/Wails-v3.0.0--alpha-blue)](https://wails.io)
[![React](https://img.shields.io/badge/React-19.2.4-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.2.2-38bdf8)](https://tailwindcss.com)
[![Bun](https://img.shields.io/badge/Bun-1.3.5-f9f1e1)](https://bun.sh)

## ✨ 特性

- ⚡️ **React 19** - 最新的 React 版本，带来更好的性能
- 🎨 **Tailwind CSS v4** - 使用全新的 Vite 插件，无需配置文件
- 📦 **Bun** - 超快的 JavaScript 运行时和包管理器
- 🔷 **TypeScript** - 完整的类型安全支持
- 🎯 **自动绑定生成** - Go 方法自动生成 TypeScript 绑定
- 🖥️ **系统托盘支持** - 内置系统托盘集成示例
- 🎭 **现代化 UI** - 深色主题、渐变背景、毛玻璃效果
- 🔥 **热重载** - 前端和后端代码修改即时生效

## 📋 前置要求

在使用此模板之前，请确保已安装：

- [Go](https://go.dev/dl/) 1.21 或更高版本
- [Bun](https://bun.sh/) 1.0 或更高版本
- [Wails v3](https://v3.wails.io/getting-started/installation/) alpha 版本

### 安装 Bun

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

### 安装 Wails v3

```bash
go install github.com/wailsapp/wails/v3/cmd/wails3@latest
```

## 🚀 快速开始

### 使用模板创建项目

```bash
# 使用本地模板
wails3 init -n myapp -t ./wails3-react-ts-tailwind-bun

# 或从 GitHub（私有仓库需要认证）
git clone https://github.com/Fromsko/wails3-react-ts-tailwind-bun.git
wails3 init -n myapp -t ./wails3-react-ts-tailwind-bun
```

### 开发模式

```bash
cd myapp
wails3 dev
```

这将启动开发服务器，支持前端和后端的热重载。

### 生产构建

```bash
wails3 build
```

构建完成后，可执行文件位于 `bin/` 目录。

## 📁 项目结构

```
myapp/
├── main.go                 # Go 应用入口
├── greetservice.go         # Go 服务示例
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── App.tsx        # React 主组件
│   │   ├── index.css      # Tailwind CSS 导入
│   │   └── types/         # TypeScript 类型定义
│   ├── bindings/          # 自动生成的 Go 绑定
│   ├── package.json       # 前端依赖
│   ├── vite.config.ts     # Vite 配置
│   └── tsconfig.json      # TypeScript 配置
├── build/                  # 构建配置
│   ├── Taskfile.yml       # 构建任务
│   ├── windows/           # Windows 特定配置
│   ├── darwin/            # macOS 特定配置
│   └── linux/             # Linux 特定配置
└── bin/                    # 构建输出目录
```

## 🎯 核心功能

### 系统托盘集成

模板内置了完整的系统托盘支持：

- 🖱️ 右键菜单（显示/隐藏窗口、退出）
- 🌓 深色/浅色模式图标自动切换
- 📌 窗口附加到托盘图标
- ⚡ 前端和托盘菜单都可以退出应用

### TypeScript 绑定

Go 方法会自动生成 TypeScript 绑定：

```go
// greetservice.go
func (g *GreetService) Greet(name string) string {
    return "Hello " + name + "!"
}
```

```typescript
// 自动生成的绑定
import { GreetService } from '../bindings/changeme'

const result = await GreetService.Greet("World")
```

### Tailwind CSS v4

使用最新的 Tailwind CSS v4 和 Vite 插件：

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* index.css */
@import "tailwindcss";
```

## 📚 文档和资源

### 官方文档

- 📖 [Wails v3 文档](https://v3.wails.io/) - Wails 官方文档
- ⚛️ [React 文档](https://react.dev/) - React 官方文档
- 🎨 [Tailwind CSS v4 文档](https://tailwindcss.com/docs) - Tailwind CSS 文档
- 📦 [Bun 文档](https://bun.sh/docs) - Bun 官方文档

### 社区资源

- 💬 [Wails Discord](https://discord.gg/JDdSxwjhGf) - 加入 Wails 社区
- 🐙 [Wails GitHub](https://github.com/wailsapp/wails) - 源代码和问题追踪
- 💡 [Wails 讨论区](https://github.com/wailsapp/wails/discussions) - 提问和分享

### 学习资源

- 📺 [Wails 示例项目](https://github.com/wailsapp/wails/tree/v3/examples) - 官方示例
- 📝 [模板创建指南](./docs/TEMPLATE_GUIDE.md) - 如何创建自定义模板
- 🔧 [扩展指南](./docs/EXTENDING.md) - 如何扩展此模板
- 🐛 [常见问题](./docs/FAQ.md) - 常见问题和解决方案

## 🔧 常见任务

### 添加新的 Go 服务

1. 创建服务文件：

```go
// myservice.go
package main

type MyService struct{}

func NewMyService() *MyService {
    return &MyService{}
}

func (s *MyService) DoSomething(input string) string {
    return "Result: " + input
}
```

2. 在 `main.go` 中注册服务：

```go
Services: []application.Service{
    application.NewService(NewGreetService()),
    application.NewService(NewMyService()), // 添加新服务
},
```

3. 重新构建以生成绑定：

```bash
wails3 build
```

### 添加新的依赖

```bash
# 前端依赖
cd frontend
bun add package-name

# Go 依赖
go get github.com/some/package
```

### 自定义 UI

编辑 `frontend/src/App.tsx` 和 `frontend/src/index.css`，使用 Tailwind CSS 类名快速构建 UI。

## 🐛 故障排除

### 常见问题

**问题：TypeScript 找不到绑定模块**

```bash
# 重新生成绑定
wails3 generate bindings -ts
```

**问题：Bun 命令找不到**

```bash
# 确认 Bun 已安装
bun --version

# 重新安装 Bun
curl -fsSL https://bun.sh/install | bash
```

**问题：前端构建失败**

```bash
# 清理并重新安装依赖
cd frontend
rm -rf node_modules bun.lockb
bun install
```

**问题：系统托盘图标不显示**

- Windows: 检查 `build/windows/icon.ico` 是否存在
- macOS: 检查 `build/darwin/icons.icns` 是否存在
- 重新运行 `wails3 generate icons`

更多问题请查看 [FAQ 文档](./docs/FAQ.md)。

## 📝 开发指南

详细的开发指南请查看 `docs/` 目录：

- [模板创建指南](./docs/TEMPLATE_GUIDE.md) - 如何创建和发布自定义模板
- [扩展指南](./docs/EXTENDING.md) - 如何扩展和定制此模板
- [踩坑记录](./docs/PITFALLS.md) - 开发过程中的常见陷阱和解决方案
- [最佳实践](./docs/BEST_PRACTICES.md) - 推荐的开发实践

## 🤝 贡献

欢迎贡献！如果你发现 bug 或有改进建议，请：

1. Fork 此仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Wails](https://wails.io) - 强大的 Go + Web 桌面应用框架
- [React](https://react.dev) - 用于构建用户界面的 JavaScript 库
- [Tailwind CSS](https://tailwindcss.com) - 实用优先的 CSS 框架
- [Bun](https://bun.sh) - 快速的 JavaScript 运行时

---

**Happy Coding! 🎉**

如果这个模板对你有帮助，请给个 ⭐️ Star！
