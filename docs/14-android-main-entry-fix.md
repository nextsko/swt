---
tags:
  - wails3
  - android
  - cgo
  - c-shared
  - debugging
aliases:
  - Android 入口函数修复
  - c-shared 构建陷阱
created: 2026-04-18
updated: 2026-04-18
status: active
---

> [!abstract] 概述
> 修复 Wails 3 Android 应用启动后 WebView 报 ERR_CONNECTION_REFUSED 的问题。根本原因是 `main_android.go` 位于子目录中，`go build` 无法将其编入 c-shared 库，导致 Go 侧未注册 `main()` 函数。

## 问题现象

Android APK 安装后启动，WebView 显示：

```text
位于 https://wails.localhost/ 的网页无法加载
net::ERR_CONNECTION_REFUSED
```

## 根因分析

通过 `adb logcat` 捕获关键日志：

```text
[Android/warn] 🤖 [JNI] No main function registered!
[Android/debug] 🤖 [JNI] nativeServeAsset: GET /index.html
[Android/error] 🤖 [JNI] Timeout waiting for app to be ready
W WailsPathHandler: Asset not found: /index.html
```

### 关键发现

1. **`RegisterAndroidMain` 未被调用** — Go 主函数未注册
2. **资源请求超时** — `waitForAppReady` 等待 10 秒后超时
3. **WebView 回退到网络请求** — 返回 null 后触发 `ERR_CONNECTION_REFUSED`

### 根本原因

Wails v3 模板将 `main_android.go` 放在 `build/android/` 子目录：

```go
// build/android/main_android.go
//go:build android

package main

import "github.com/wailsapp/wails/v3/pkg/application"

func init() {
    application.RegisterAndroidMain(main)
}
```

但 `go build -buildmode=c-shared` 在项目根目录执行时，**只编译根目录下的 `package main` 文件**。子目录中的同名 package 被忽略。

## 解决方案

在项目根目录创建 `main_android.go`：

```go
//go:build android

package main

import "github.com/wailsapp/wails/v3/pkg/application"

func init() {
    application.RegisterAndroidMain(main)
}
```

## 验证流程

### 1. 重新编译 Go 共享库

```powershell
$env:ANDROID_HOME="C:\Android\sdk"
$env:ANDROID_NDK_HOME="C:\Android\sdk\ndk\26.1.10909125"
task android:compile:go:shared ARCH=arm64
```

### 2. 重新打包 APK

```powershell
cd build/android
.\gradlew.bat assembleDebug
Copy-Item app\build\outputs\apk\debug\app-debug.apk ..\..\bin\swt.apk -Force
```

### 3. 安装并启动

```powershell
adb install -r bin\swt.apk
adb shell am start -n com.wails.app/.MainActivity
```

### 4. 查看日志验证

```powershell
adb logcat -c
adb shell am force-stop com.wails.app
adb shell am start -n com.wails.app/.MainActivity
Start-Sleep -Seconds 5
adb logcat -d | Select-String -Pattern "Wails|🤖" | Select-Object -First 40
```

修复后日志：

```text
✅ index.html - 200 OK
✅ JS bundle - 212097 bytes
✅ CSS bundle - 18624 bytes
✅ Runtime 注入成功
✅ favicon 加载
```

## 调试技巧

### adb logcat 过滤

```powershell
# 按 tag 过滤 Wails 相关日志
adb logcat WailsActivity:V WailsBridge:V WailsPathHandler:V WailsNative:V *:S

# 按进程 PID 过滤
adb logcat --pid=$(adb shell pidof com.wails.app)

# 按关键词过滤
adb logcat -d | Select-String -Pattern "Wails|🤖"
```

### Go 侧日志输出位置

Wails Android 使用 `androidLogf` 输出到 logcat 的 `Go` tag：

```text
E Go : [Android/debug] 🤖 [JNI] nativeServeAsset: GET /index.html
```

## 关键资料

- **Wails v3 alpha**: https://v3alpha.wails.io/
- **Go c-shared 构建**: https://pkg.go.dev/cmd/go#hdr-Build_modes
- **Android WebViewAssetLoader**: https://developer.android.com/reference/androidx/webkit/WebViewAssetLoader

## 代码片段

### 项目根目录结构（修复后）

```text
swt/
├── main.go              # 主入口（包含 embed）
├── main_android.go      # Android 入口注册 ← 新增
├── backend/
├── build/
│   ├── android/
│   │   ├── main_android.go   # 原位置（可保留但不生效）
│   │   └── Taskfile.yml
│   └── ...
└── frontend/
```

### Android 构建流程

1. `bun run build` — 前端构建到 `frontend/dist/`
2. `go build -tags android,debug -buildmode=c-shared` — 生成 `.so`（包含嵌入资源）
3. `gradlew assembleDebug` — 打包 APK（包含 `.so` 和 Java 代码）
4. `adb install -r swt.apk` — 安装到设备

## 相关笔记

- [[13-remove-system-tray-and-fix-android-build]] - 移除系统托盘配置
- [[12-wails3-android-build-fix]] - Wails 3 Android 构建修复
- [[11-android-build-errors]] - Wails 3 Android 构建错误

## 注意事项

> [!tip] c-shared 构建陷阱
> 使用 `go build -buildmode=c-shared` 时，所有 `package main` 的文件必须位于**同一个目录**（项目根目录）。子目录中的 `.go` 文件不会被编译进共享库。

> [!warning] 前端资源重新构建
> 修改前端代码后必须先运行 `bun run build`，再重新编译 Go 共享库（因为资源通过 `//go:embed` 嵌入 `.so`）。

> [!danger] WebView 缓存
> 修复后如仍看到旧 UI，可能是 WebView 缓存。建议在设备上清除应用数据或在调试时禁用缓存。
