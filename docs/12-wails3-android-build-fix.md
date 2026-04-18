---
tags:
  - wails3
  - android
  - build
  - fix
  - windows
aliases:
  - Wails 3 Android 构建修复
  - Windows Android 构建错误修复
created: 2026-04-18
updated: 2026-04-18
status: active
---

> [!abstract] 概述
> 成功修复 Wails v3 alpha.76 版本在 Windows 上构建 Android 应用的框架级别错误，完成环境配置并生成 APK 文件。

## 操作流程

### 1. 安装 Android SDK（无 Android Studio）

下载并安装 Android Command Line Tools：

```powershell
# 创建 SDK 目录
mkdir C:\Android\sdk\cmdline-tools\latest -Force

# 解压 commandlinetools-win-14742923_latest.zip
Expand-Archive -Path "c:\Users\Administrator\Downloads\commandlinetools-win-14742923_latest.zip" -DestinationPath "C:\Android\sdk\cmdline-tools\latest" -Force

# 修复目录结构（解压后多了一层 cmdline-tools 目录）
Move-Item -Path "C:\Android\sdk\cmdline-tools\latest\cmdline-tools\*" -Destination "C:\Android\sdk\cmdline-tools\latest\" -Force
Remove-Item -Path "C:\Android\sdk\cmdline-tools\latest\cmdline-tools" -Force
```

### 2. 安装 SDK 组件

使用 sdkmanager 安装必要组件：

```powershell
# 设置环境变量
$env:ANDROID_HOME = "C:\Android\sdk"
$env:PATH += ";C:\Android\sdk\cmdline-tools\latest\bin;C:\Android\sdk\platform-tools"

# 接受许可证
sdkmanager --licenses

# 安装组件
sdkmanager "platform-tools"
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
sdkmanager "ndk;26.1.10909125"
sdkmanager "emulator"
```

### 3. 配置系统环境变量

```powershell
# 永久设置环境变量
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Android\sdk', 'User')
$path = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$path += ';C:\Android\sdk\cmdline-tools\latest\bin;C:\Android\sdk\platform-tools;C:\Android\sdk\emulator'
[System.Environment]::SetEnvironmentVariable('Path', $path, 'User')
```

### 4. 修复 Wails v3 框架错误

#### 4.1 添加 Android 事件定义

文件：`vendor/github.com/wailsapp/wails/v3/pkg/events/events.go`

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

同时添加到 eventToJS 映射：

```go
1259: "android:ActivityCreated",
```

#### 4.2 修复 runtime.Core 调用

文件：`vendor/github.com/wailsapp/wails/v3/pkg/application/application_android.go`

```go
// 修改前
runtimeJS := runtime.Core()

// 修改后
runtimeJS := runtime.Core(nil)
```

#### 4.3 添加 iosMethodNames 到 Android

文件：`vendor/github.com/wailsapp/wails/v3/pkg/application/messageprocessor_android.go`

```go
// iosMethodNames is empty on Android (iOS methods not available)
var iosMethodNames = map[int]string{}
```

### 5. 修复 Taskfile Windows 支持

#### 5.1 添加 -mod=vendor 标志

文件：`build/android/Taskfile.yml`

```yaml
go build -mod=vendor -buildmode=c-shared {{.BUILD_FLAGS}} \
  -o build/android/app/src/main/jniLibs/$JNI_DIR/libwails.so
```

#### 5.2 修复主机 OS 检测

```yaml
# Determine toolchain based on host OS
if command -v uname >/dev/null 2>&1; then
  OS_NAME=$(uname -s)
  case "$OS_NAME" in
    Darwin) HOST_TAG="darwin-x86_64" ;;
    Linux)  HOST_TAG="linux-x86_64" ;;
    *)      HOST_TAG="windows-x86_64" ;;
  esac
else
  # Windows (no uname command)
  HOST_TAG="windows-x86_64"
fi
```

#### 5.3 修复 Gradle 命令

```yaml
assemble:apk:
  summary: Assembles the APK using Gradle
  cmds:
    - cd build/android && ./gradlew.bat assembleDebug
    - cp build/android/app/build/outputs/apk/debug/app-debug.apk {{.BIN_DIR}}/{{.APP_NAME}}.apk
    - echo "APK created: {{.BIN_DIR}}/{{.APP_NAME}}.apk"
```

### 6. 构建 APK

```powershell
# 设置环境变量
$env:ANDROID_HOME="C:\Android\sdk"
$env:ANDROID_NDK_HOME="C:\Android\sdk\ndk\26.1.10909125"
$env:PATH="C:\Android\sdk\cmdline-tools\latest\bin;C:\Android\sdk\platform-tools;C:\Android\sdk\emulator;$env:PATH"

# 编译 Go 到 Android 共享库
task android:compile:go:shared ARCH=arm64

# 使用 Gradle 组装 APK
cd build/android
.\gradlew.bat assembleDebug

# 复制 APK
Copy-Item app\build\outputs\apk\debug\app-debug.apk ..\..\bin\swt.apk
```

## 关键资料

- **Wails v3 文档**: https://v3alpha.wails.io/
- **Android SDK 下载**: https://developer.android.com/studio#command-tools
- **Android NDK r26d**: https://developer.android.com/ndk/downloads
- **Wails GitHub Issues**: https://github.com/wailsapp/wails/issues

## 错误总结

### 原始错误

```
undefined: events.Android
undefined: iosMethodNames
not enough arguments in call to runtime.Core
```

### 根本原因

Wails v3 alpha 版本的 Android 支持不完整：
- events 包缺少 Android 事件定义
- Android 构建中错误引用 iOS 方法名映射
- runtime.Core 函数签名变更未同步到 Android 实现

### 修复结果

- ✅ Android 事件定义已添加
- ✅ runtime.Core 调用参数已修复
- ✅ iOS 方法名映射已添加到 Android
- ✅ Taskfile Windows 支持已修复
- ✅ APK 构建成功（14.1 MB）

## 代码片段

### 完整的 Android 事件定义

```go
// vendor/github.com/wailsapp/wails/v3/pkg/events/events.go

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

### Android 方法名映射

```go
// vendor/github.com/wailsapp/wails/v3/pkg/application/messageprocessor_android.go

const (
	AndroidHapticsVibrate = 0
	AndroidDeviceInfo     = 1
	AndroidToast          = 2
)

var androidMethodNames = map[int]string{
	AndroidHapticsVibrate: "Haptics.Vibrate",
	AndroidDeviceInfo:     "Device.Info",
	AndroidToast:          "Toast.Show",
}

// iosMethodNames is empty on Android (iOS methods not available)
var iosMethodNames = map[int]string{}
```

## 相关笔记

- [[09-wails3-android-support]] - Wails 3 Android 支持情况
- [[10-android-build-environment]] - Android 构建环境配置
- [[11-android-build-errors]] - Wails 3 Android 构建错误分析

## 环境信息

- **操作系统**: Windows 10.0.26200
- **Go 版本**: 1.26.1
- **Wails 版本**: v3.0.0-alpha.76
- **Android NDK**: 26.1.10909125
- **目标架构**: arm64-v8a
- **APK 大小**: 14.1 MB
- **构建时间**: 1分40秒

## 注意事项

> [!warning] Vendor 依赖
> 本次修复直接修改了 vendor 目录中的 Wails v3 源码。这些修改会在运行 `go mod tidy` 或更新依赖时丢失。建议：
>
> 1. 将这些修改提交为 PR 到 Wails 项目
> 2. 或使用 replace 指令指向本地修改的版本
> 3. 等待 Wails v3 官方修复这些 alpha 阶段的 bug

> [!tip] Windows 构建注意事项
> 在 Windows 上构建 Android 应用时：
> - 使用 `gradlew.bat` 而非 `./gradlew`
> - 确保环境变量正确设置（ANDROID_HOME, ANDROID_NDK_HOME）
> - 使用 `-mod=vendor` 强制使用本地修改的依赖
