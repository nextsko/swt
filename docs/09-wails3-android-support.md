---
tags:
  - wails3
  - android
  - mobile
  - cross-platform
aliases:
  - Wails 3 Android 支持
  - Wails 3 移动端支持
created: 2026-04-18
updated: 2026-04-18
status: active
---

> [!abstract] 概述
> Wails v3 已正式支持 Android 平台，当前项目已包含完整的 Android 构建配置和实现。

## 核心内容

### ✅ 官方支持状态

**Wails v3 支持 Android** - 这是 v3 版本的新特性，当前处于 ALPHA 阶段。

根据本地代码库和官方文档：
- Wails v3 alpha 版本已包含 Android 平台支持
- 本项目 `build/android/` 目录包含完整的 Android 构建系统
- 支持使用 Android NDK 编译 Go 代码为共享库 (.so)
- 通过 WebView 集成前端应用

### 📱 本项目 Android 实现

#### 构建系统
- **Taskfile.yml**: 完整的 Android 构建任务
  - `install:deps`: 安装 Android 开发依赖
  - `build`: 编译 Android 应用
  - `package`: 打包 APK
  - `package:fat`: 多架构 fat APK
  - `deploy-emulator`: 部署到模拟器
  - `run`: 在模拟器中运行

#### 支持的架构
- `arm64` (ARM64-v8a)
- `amd64/x86_64` (x86_64)

#### 技术栈
- **Android NDK**: r26d
- **Min SDK**: 21 (Android 5.0)
- **Target SDK**: 34 (Android 14)
- **构建模式**: c-shared (Go 编译为共享库)

#### Java 桥接层
项目包含完整的 Java 桥接代码：
- `MainActivity.java`: 主 Activity，管理 WebView 和应用生命周期
- `WailsBridge.java`: Go 与 Android 之间的桥接
- `WailsJSBridge.java`: JavaScript 接口，用于前端与 Go 通信
- `WailsPathHandler.java`: 资源路径处理器

#### Go Android 入口
`main_android.go`:
```go
//go:build android

package main

import "github.com/wailsapp/wails/v3/pkg/application"

func init() {
    // 注册 main 函数供 Android 初始化时调用
    // 这在 c-shared 构建模式下是必需的，因为 main() 不会自动调用
    application.RegisterAndroidMain(main)
}
```

### 🔧 构建流程

1. **编译 Go 代码**:
   ```bash
   task compile:go:shared ARCH=arm64
   ```
   - 使用 Android NDK 工具链
   - 编译为 `libwails.so` 共享库
   - 输出到 `build/android/app/src/main/jniLibs/arm64-v8a/`

2. **生成前端绑定**:
   ```bash
   task generate:android:bindings
   ```
   - 生成 TypeScript 绑定
   - 设置 `GOOS=android`, `CGO_ENABLED=1`

3. **构建前端**:
   ```bash
   task common:build:frontend
   ```

4. **打包 APK**:
   ```bash
   task assemble:apk
   ```
   - 使用 Gradle 构建
   - 输出到 `bin/{APP_NAME}.apk`

### 🌐 相关资源

- [GitHub Issue #4886](https://github.com/wailsapp/wails/issues/4886) - 关于 Android/iOS 支持的讨论
- [Wails v3 官方文档](https://v3alpha.wails.io/) - Wails v3 文档
- [wails-android-test](https://github.com/AlbinoDrought/wails-android-test) - 社区 Android 测试项目

### 📊 社区反馈

根据 GitHub Issue #4886，社区对 Android 支持有强烈需求：
- 用户对比 Tauri（已支持 Android/iOS）
- 官方已在 v3 中实现 Android 支持
- 当前处于 alpha 阶段，API 已相对稳定

## 来源信息

- **搜索方式**: 本地代码库搜索 + 网络搜索
- **发现时间**: 2026-04-18
- **可信度评估**: 高（基于实际代码实现和官方文档）
- **证据**:
  - 本项目 `build/android/` 完整实现
  - Wails v3 官方文档提及 alpha 版本
  - GitHub issues 讨论记录
