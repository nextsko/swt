---
tags:
  - wails3
  - pitfalls
  - troubleshooting
  - development
aliases:
  - 踩坑记录
  - 常见陷阱
created: 2026-04-18
updated: 2026-04-18
status: active
---

# 踩坑记录

> 开发 Wails3 应用时的常见陷阱和解决方案

## 🚨 模板相关

### 1. 模板变量作用域错误

**问题：** 在 init 时报错找不到 `Publisher`、`ProcessorArchitecture` 等字段

```text
ERROR template: app_manifest.xml.tmpl:12:17: executing "app_manifest.xml.tmpl"
at <.Publisher>: can't evaluate field Publisher
```

**原因：** 这些字段只在 **package** 阶段可用，不在 **init** 阶段

**解决方案：**
- 包含 package 阶段变量的文件不应该有 `.tmpl` 扩展名
- 将 `app_manifest.xml.tmpl` 重命名为 `app_manifest.xml`
- 将 `template.xml.tmpl` 重命名为 `template.xml`

**Init 阶段可用变量：**
- `Name`, `BinaryName`, `ProductName`, `ProductDescription`
- `ProductVersion`, `ProductCompany`, `ProductCopyright`
- `ProductComments`, `ProductIdentifier`
- `Typescript`, `WailsVersion`

**Package 阶段可用变量：**
- `Publisher`, `ProcessorArchitecture`
- `FileAssociations`, `Protocols`
- `ExecutablePath`, `ExecutableName`
- `OutputPath`, `CertificatePath`

### 2. TypeScript 绑定未生成

**问题：** 构建时报错找不到绑定模块

```text
error TS7016: Could not find a declaration file for module '../bindings/changeme'
```

**原因：** 绑定生成命令缺少 `-ts` 参数

**解决方案：**

在 `build/Taskfile.tmpl.yml` 中强制使用 TypeScript 绑定：

```yaml
generate:bindings:
  cmds:
    # 强制生成 TypeScript 绑定
    - wails3 generate bindings -ts -f {{ "'{{.BUILD_FLAGS}}'" }} -clean=true
```

**不要使用条件判断：**
```yaml
# ❌ 错误 - 依赖 Typescript 变量
- wails3 generate bindings {{- if .Typescript}} -ts{{end}}

# ✅ 正确 - 强制使用 -ts
- wails3 generate bindings -ts
```

### 3. 模板语法转义问题

**问题：** Taskfile 中的变量在 init 时被处理，导致生成的项目中变量丢失

**原因：** 模板语法没有正确转义

**解决方案：**

```yaml
# ❌ 错误 - 会在 init 时被处理
cmds:
  - bun run {{.BUILD_COMMAND}}

# ✅ 正确 - 使用双引号转义
cmds:
  - bun run {{ "{{.BUILD_COMMAND}}" }}

# ✅ 或使用单引号
cmds:
  - bun run {{ "'{{.BUILD_COMMAND}}'" }}
```

## 🔧 构建相关

### 4. Bun 和 npm 混用

**问题：** 模板配置了 Bun，但生成的项目仍使用 npm

**原因：**
- `package-lock.json` 存在会触发 npm
- Taskfile 中的源文件检查包含 `package-lock.json`

**解决方案：**

```yaml
install:frontend:deps:
  sources:
    - package.json
    - bun.lock  # ✅ 使用 bun.lock
    # - package-lock.json  # ❌ 删除这行
  preconditions:
    - sh: bun version  # ✅ 检查 bun
  cmds:
    - bun install  # ✅ 使用 bun
```

删除前端目录中的 `package-lock.json`：

```bash
cd frontend
rm package-lock.json
```

**本项目已配置为使用 Bun，无需混用 npm。**

### 5. TypeScript 配置问题

**问题：** TypeScript 找不到 bindings 目录中的模块

**原因：** `tsconfig.app.json` 的 `include` 没有包含 `bindings` 目录

**解决方案：**

```json
{
  "include": ["src", "bindings"],  // ✅ 添加 bindings
  "compilerOptions": {
    "verbatimModuleSyntax": false  // ✅ 允许 .d.ts 文件
  }
}
```

### 6. Tailwind CSS v4 配置错误

**问题：** 使用了 v3 的配置方式

**错误做法：**

```javascript
// ❌ 不需要 tailwind.config.js
// ❌ 不需要 postcss.config.js
```

**正确做法：**

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],  // ✅ 使用 Vite 插件
})
```

```css
/* index.css */
@import "tailwindcss";  /* ✅ 直接导入 */
```

## 🐛 运行时问题

### 7. 系统托盘退出功能不工作

**问题：** 点击 "Quit App" 按钮没有反应

**原因：**
- Windows 需要特殊处理窗口关闭
- 前端直接调用 `runtime.Quit()` 可能不工作

**解决方案：**

**Go 后端：**
```go
var quitSignal = make(chan bool)

func (g *GreetService) QuitApp() {
    quitSignal <- true
}

func main() {
    app := application.New(application.Options{
        Windows: application.WindowsOptions{
            DisableQuitOnLastWindowClosed: true,  // ✅ 关键配置
        },
    })

    // 监听退出信号
    go func() {
        <-quitSignal
        app.Quit()
    }()
}
```

**前端：**
```typescript
// ✅ 通过 Go 服务退出
await GreetService.QuitApp()

// ❌ 不要直接调用
// await window.runtime.Quit()
```

### 8. window.runtime 类型错误

**问题：** TypeScript 报错 `window.runtime` 不存在

**解决方案：**

创建 `frontend/src/types/global.d.ts`：

```typescript
declare global {
  interface Window {
    runtime: {
      Events: {
        On: (event: string, callback: (data: any) => void) => void
      }
      Window: {
        Hide: () => Promise<void>
      }
    }
  }
}

export {}
```

### 9. 缺少 @wailsio/runtime 依赖

**问题：** 构建时找不到 `@wailsio/runtime` 模块

**解决方案：**

```bash
cd frontend
bun add @wailsio/runtime
```

## 📦 打包相关

### 10. MSIX 打包失败

**问题：** 打包时找不到某些字段

**原因：** MSIX 相关的模板文件在 init 时被错误处理

**解决方案：**

确保以下文件**没有** `.tmpl` 扩展名：
- `build/windows/msix/app_manifest.xml`
- `build/windows/msix/template.xml`

这些文件会在 `wails3 package` 时被处理，而不是在 `wails3 init` 时。

### 11. 图标文件缺失

**问题：** 系统托盘图标不显示

**解决方案：**

```bash
# 重新生成图标
wails3 generate icons -input build/appicon.png

# 检查生成的文件
ls build/windows/icon.ico      # Windows
ls build/darwin/icons.icns     # macOS
```

## 🔍 调试技巧

### 查看生成的绑定

```bash
# 手动生成绑定
wails3 generate bindings -ts

# 查看生成的文件
ls frontend/bindings/changeme/
```

### 清理构建缓存

```bash
# 清理前端
cd frontend
rm -rf node_modules bun.lockb dist
bun install

# 清理 Go
go clean -cache
go mod tidy
```

### 检查 Taskfile 配置

```bash
# 查看可用任务
task --list

# 查看特定任务
task --summary generate:bindings
```

## 💡 最佳实践

1. **始终查看官方文档** - 不要自己发明解决方案
2. **理解模板变量作用域** - Init vs Package 阶段
3. **使用正确的包管理器** - 本项目使用 Bun
4. **保持依赖更新** - 定期更新 Wails、React、Tailwind
5. **测试多平台** - Windows、macOS、Linux 行为可能不同

## 📚 相关资源

- [Wails v3 文档](https://v3.wails.io/)
- [模板创建指南](./TEMPLATE_GUIDE.md)
- [常见问题](./FAQ.md)
- [最佳实践](./BEST_PRACTICES.md)
