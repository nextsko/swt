# 研究文档索引

## 最新研究 (2026-04-18)

### [16-phase-b-chat-interactions.md](./16-phase-b-chat-interactions.md)
**主题**: 聊天页交互阶段 B 实现
**标签**: wails3, react, chat, phase-b, interactions
**摘要**: 在阶段 A 基础上补齐聊天页高级交互。新增全局搜索页、气泡长按菜单（复制/引用/转发/撤回/删除）、表情面板、群成员管理、AI 打字指示、草稿持久化闭环。后端扩展 RecallMessage / DeleteMessage，完成 Windows 环境下的 APK 构建并安装到真机。

### [09-wails3-android-support.md](./09-wails3-android-support.md)
**主题**: Wails 3 Android 支持情况
**标签**: wails3, android, mobile, cross-platform
**摘要**: Wails v3 已正式支持 Android 平台，当前项目已包含完整的 Android 构建配置和实现。包括构建系统、支持的架构、技术栈、Java 桥接层等详细信息。

### [10-android-build-environment.md](./10-android-build-environment.md)
**主题**: Android 构建环境配置
**标签**: android, environment, setup, dependencies
**摘要**: Wails 3 Android 构建需要完整的 Android 开发环境，包括 Android SDK、NDK (r26d)、JDK 11+、adb、emulator、AVD 等组件。包含详细的安装步骤、环境变量配置和常见问题解决方案。

### [11-android-build-errors.md](./11-android-build-errors-2026-04-18.md)
**主题**: Wails 3 Android 构建错误
**标签**: wails3, android, build, errors, windows
**摘要**: Wails v3 alpha 版本在 Windows 上构建 Android 应用时遇到框架级别编译错误，包括 undefined: events.Android、undefined: iosMethodNames、runtime.Core 参数不足等问题。这些是 Wails v3 alpha 的已知 bug，需要等待官方修复或在 Linux/macOS 上构建。

### [12-wails3-android-build-fix.md](./12-wails3-android-build-fix.md)
**主题**: Wails 3 Android 构建修复
**标签**: wails3, android, build, fix, windows
**摘要**: 成功修复 Wails v3 alpha.76 版本在 Windows 上构建 Android 应用的框架级别错误，完成环境配置并生成 APK 文件。包括安装 Android SDK（无 Android Studio）、修复框架代码错误、修改 Taskfile Windows 支持等完整流程。

### [13-remove-system-tray-and-fix-android-build.md](./13-remove-system-tray-and-fix-android-build.md)
**主题**: 移除系统托盘配置和修复 Android 构建
**标签**: wails3, system-tray, android, taskfile, fix
**摘要**: 将 Wails 3 应用从系统托盘应用改为普通桌面应用，并修复 Android 构建的 Taskfile 配置问题。包括移除系统托盘初始化代码、前端托盘控制按钮、修复 Taskfile YAML 语法错误、配置 Android SDK 路径等。

### [14-android-main-entry-fix.md](./14-android-main-entry-fix.md)
**主题**: Android 主入口函数修复
**标签**: wails3, android, cgo, c-shared, debugging
**摘要**: 修复 Android WebView 报 ERR_CONNECTION_REFUSED 的问题。根本原因是 main_android.go 位于子目录中导致 go build 无法编入 c-shared 库。解决方案是在项目根目录创建 main_android.go 调用 RegisterAndroidMain。包含完整的 adb logcat 调试过程。

### [15-android-runtime-call-crash-fix.md](./15-android-runtime-call-crash-fix.md)
**主题**: Android 交互闪退修复
**标签**: wails3, android, webview, jni, debugging, crash
**摘要**: 修复 Android 点击交互后闪退的问题。三层根因：1) Android WebView 无法读取 POST body；2) Go 构造 request 时 body=nil 导致 io.Copy panic；3) Java 硬编码 Content-Type=application/json。通过 JS fetch 劫持将 POST body 转为 URL query params 解决。

---

## 项目文档

### [01-wails3-build-fix.md](./01-wails3-build-fix.md)
Wails 3 构建修复相关文档

### [02-bun-migration.md](./02-bun-migration.md)
Bun 迁移指南

### [03-taskfile-architecture.md](./03-taskfile-architecture.md)
Taskfile 架构说明

### [04-pitfalls.md](./04-pitfalls.md)
常见陷阱和解决方案

### [05-faq.md](./05-faq.md)
常见问题解答

### [06-template-guide.md](./06-template-guide.md)
模板创建指南

### [07-extending.md](./07-extending.md)
扩展指南

### [08-best-practices.md](./08-best-practices.md)
最佳实践

---

## 搜索统计

- **总文档数**: 15
- **研究文档数**: 7
- **项目文档数**: 8
- **最后更新**: 2026-04-18
