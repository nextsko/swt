---
tags:
  - android
  - environment
  - setup
  - dependencies
aliases:
  - Android 构建环境配置
  - Android 开发环境要求
created: 2026-04-18
updated: 2026-04-18
status: active
---

> [!abstract] 概述
> Wails 3 Android 构建需要完整的 Android 开发环境，包括 Android SDK、NDK、JDK、Gradle 等组件。

## 核心内容

### 📦 必需组件

#### 1. Go
- **版本要求**: Go 1.21+
- **安装方式**: https://go.dev/dl/
- **检查命令**: `go version`

#### 2. Android SDK
- **环境变量**: `ANDROID_HOME` 或 `ANDROID_SDK_ROOT`
- **必需组件**:
  - Android SDK Platform (API 34)
  - Android SDK Build-Tools
  - Android SDK Platform-Tools
  - Android Emulator
- **默认路径**:
  - macOS: `$HOME/Library/Android/sdk`
  - Linux: `$HOME/Android/Sdk`
  - Windows: `%LOCALAPPDATA%\Android\Sdk`

#### 3. Android NDK
- **环境变量**: `ANDROID_NDK_HOME`
- **版本要求**: r26d (项目配置)
- **安装方式**: Android Studio > SDK Manager > SDK Tools > NDK (Side by side)
- **默认位置**: `$ANDROID_HOME/ndk/{version}`
- **必需原因**: 用于编译 Go 代码为 Android 共享库 (.so)

#### 4. Java/JDK
- **版本要求**: JDK 11+
- **推荐**: OpenJDK
- **检查命令**: `java -version`
- **安装方式**:
  - macOS: `brew install openjdk@11`
  - Linux: `sudo apt install openjdk-11-jdk`
  - Windows: 从 Oracle 或 Adoptium 下载

#### 5. Android 工具链
- **adb** (Android Debug Bridge)
  - 路径: `$ANDROID_HOME/platform-tools/adb`
  - 检查命令: `adb version`
- **emulator** (Android Emulator)
  - 路径: `$ANDROID_HOME/emulator/emulator`
  - 检查命令: `emulator -list-avds`

#### 6. Android Virtual Device (AVD)
- **创建方式**: Android Studio > Tools > Device Manager
- **检查命令**: `emulator -list-avds`
- **用途**: 用于在模拟器中测试应用

### 🔧 环境变量配置

#### macOS/Linux
```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk        # Linux

# Android NDK (可选，会自动检测)
export ANDROID_NDK_HOME=$ANDROID_HOME/ndk/{version}

# PATH
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
```

#### Windows (PowerShell)
```powershell
# Android SDK
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# PATH
$env:PATH += ";$env:ANDROID_HOME\platform-tools"
$env:PATH += ";$env:ANDROID_HOME\emulator"
```

永久设置（系统环境变量）：
1. 控制面板 > 系统 > 高级系统设置 > 环境变量
2. 添加 `ANDROID_HOME` 变量
3. 编辑 `PATH` 变量，添加上述路径

### 📲 安装步骤

#### 方式一：使用 Android Studio（推荐）

1. **安装 Android Studio**
   - 下载: https://developer.android.com/studio
   - 按照安装向导完成安装

2. **安装 SDK 组件**
   - 打开 Android Studio
   - Tools > SDK Manager
   - 在 "SDK Platforms" 标签页:
     - 勾选 Android 14.0 (API 34)
   - 在 "SDK Tools" 标签页:
     - 勾选 Android SDK Build-Tools
     - 勾选 Android SDK Platform-Tools
     - 勾选 Android Emulator
     - 勾选 NDK (Side by side)
     - 勾选 CMake (可选，用于原生构建)
   - 点击 Apply 安装

3. **创建 AVD**
   - Tools > Device Manager
   - 点击 "Create Device"
   - 选择设备型号（推荐 Pixel 6）
   - 选择系统镜像（API 34 推荐）
   - 完成创建

#### 方式二：命令行安装

```bash
# macOS
brew install --cask android-studio

# Linux (Ubuntu/Debian)
sudo apt install android-sdk

# Windows
# 下载 Android Studio 安装包
```

### ✅ 验证安装

运行项目自带的依赖检查脚本：

```bash
task android:install:deps
```

或手动检查：

```bash
# 检查 Go
go version

# 检查 Android SDK
echo $ANDROID_HOME

# 检查 adb
adb version

# 检查 emulator
emulator -list-avds

# 检查 NDK
echo $ANDROID_NDK_HOME

# 检查 Java
java -version
```

### 🎯 项目特定配置

当前项目的 Android 配置（`build/android/Taskfile.yml`）：

```yaml
vars:
  APP_ID: 'com.wails.app'
  MIN_SDK: '21'           # Android 5.0
  TARGET_SDK: '34'        # Android 14
  NDK_VERSION: 'r26d'
```

### ⚠️ 常见问题

#### 问题 1: ANDROID_HOME 未设置
**错误**: `ANDROID_HOME not set`
**解决**: 设置环境变量指向 Android SDK 安装目录

#### 问题 2: NDK 未找到
**错误**: `Android NDK not found`
**解决**:
- 通过 Android Studio SDK Manager 安装 NDK
- 或手动设置 `ANDROID_NDK_HOME`

#### 问题 3: adb 命令未找到
**错误**: `adb not found`
**解决**: 将 `$ANDROID_HOME/platform-tools` 添加到 PATH

#### 问题 4: 没有 AVD
**错误**: `No Android Virtual Devices found`
**解决**: 通过 Android Studio Device Manager 创建 AVD

#### 问题 5: Java 版本过低
**错误**: Java 编译错误
**解决**: 安装 JDK 11+ 并设置 JAVA_HOME

### 📚 相关资源

- [Android Studio 下载](https://developer.android.com/studio)
- [NDK 安装指南](https://developer.android.com/studio/projects/install-ndk)
- [JDK 版本要求](https://developer.android.com/build/jdks)
- [Gradle 兼容性](https://docs.gradle.org/current/userguide/compatibility.html)

## 来源信息

- **搜索方式**: 本地代码库分析 + 网络搜索
- **发现时间**: 2026-04-18
- **可信度评估**: 高（基于项目实际配置脚本）
- **证据**:
  - `build/android/scripts/deps/install_deps.go` 依赖检查脚本
  - `build/android/Taskfile.yml` 构建配置
  - Android 官方文档
