---
tags:
  - taskfile
  - build-system
  - wails3
  - architecture
aliases:
  - Taskfile 架构分析
  - 构建系统架构
created: 2026-04-18
updated: 2026-04-18
status: active
---

> [!abstract] 概述
> 分析 Wails 3 项目的 Taskfile 构建系统架构，包括模块化组织、平台特定任务、依赖关系和设计决策。

## 架构树

```text
Taskfile.yml (根配置)
├── includes (模块化引入)
│   ├── common: ./build/Taskfile.yml (通用任务)
│   ├── windows: ./build/windows/Taskfile.yml
│   ├── darwin: ./build/darwin/Taskfile.yml
│   ├── linux: ./build/linux/Taskfile.yml
│   ├── ios: ./build/ios/Taskfile.yml
│   └── android: ./build/android/Taskfile.yml
│
├── vars (全局变量)
│   ├── APP_NAME: "swt"
│   ├── BIN_DIR: "bin"
│   └── VITE_PORT: 9245
│
└── tasks (根任务)
    ├── build → 委托给 {{OS}}:build
    ├── package → 委托给 {{OS}}:package
    ├── run → 委托给 {{OS}}:run
    ├── dev → wails3 dev (开发模式)
    ├── setup:docker → common:setup:docker
    ├── build:server → common:build:server
    ├── run:server → common:run:server
    ├── build:docker → common:build:docker
    └── run:docker → common:run:docker
```

## 依赖树

### 根任务依赖链

```text
build
└── {{OS}}:build (平台特定)
    ├── windows:build
    │   ├── build:native / build:docker (条件选择)
    │   │   ├── common:go:mod:tidy
    │   │   ├── common:build:frontend
    │   │   │   ├── install:frontend:deps
    │   │   │   │   └── bun install
    │   │   │   └── generate:bindings
    │   │   │       └── go:mod:tidy
    │   │   └── common:generate:icons
    │   └── generate:syso
    │
    ├── darwin:build
    │   ├── build:native / build:docker (条件选择)
    │   │   ├── common:go:mod:tidy
    │   │   ├── common:build:frontend
    │   │   │   ├── install:frontend:deps
    │   │   │   │   └── bun install
    │   │   │   └── generate:bindings
    │   │   │       └── go:mod:tidy
    │   │   └── common:generate:icons
    │   └── build:universal (可选)
    │
    ├── linux:build
    │   ├── build:native / build:docker (条件选择)
    │   │   ├── common:go:mod:tidy
    │   │   ├── common:build:frontend
    │   │   │   ├── install:frontend:deps
    │   │   │   │   └── bun install
    │   │   │   └── generate:bindings
    │   │   │       └── go:mod:tidy
    │   │   ├── common:generate:icons
    │   │   └── generate:dotdesktop
    │
    ├── ios:build
    │   ├── generate:ios:overlay
    │   ├── generate:ios:xcode
    │   ├── common:go:mod:tidy
    │   ├── generate:ios:bindings
    │   ├── common:build:frontend
    │   │   ├── install:frontend:deps
    │   │   │   └── bun install
    │   │   └── generate:bindings
    │   │       └── go:mod:tidy
    │   └── common:generate:icons
    │
    └── android:build
        ├── common:go:mod:tidy
        ├── generate:android:bindings
        ├── common:build:frontend
        │   ├── install:frontend:deps
        │   │   └── bun install
        │   └── generate:bindings
        │       └── go:mod:tidy
        ├── common:generate:icons
        └── compile:go:shared
```

### Common 任务依赖链

```text
common:build:frontend
├── install:frontend:deps
│   └── bun install
└── generate:bindings
    └── go:mod:tidy

common:build:server
└── build:frontend
    ├── install:frontend:deps
    └── generate:bindings
```

## 设计树

```text
核心设计决策
├── 模块化架构
│   ├── 决策点：使用 includes 分离平台特定逻辑
│   ├── 方案选择：Taskfile v3 includes 机制
│   ├── 实现方式：common + 平台特定文件
│   └── 权衡考虑：代码复用 vs 平台隔离
│
├── 平台检测与路由
│   ├── 决策点：如何处理不同平台的构建差异
│   ├── 方案选择：{{OS}} 变量动态路由
│   ├── 实现方式：根任务委托给平台任务
│   └── 权衡考虑：统一入口 vs 平台隔离
│
├── 构建策略
│   ├── 决策点：Native vs Docker 跨平台编译
│   ├── 方案选择：条件判断自动选择
│   │   ├── Windows: CGO_ENABLED=1 时用 Docker
│   │   ├── macOS: 非 macOS 用 Docker
│   │   └── Linux: 无编译器或跨架构用 Docker
│   ├── 实现方式：preconditions + 条件表达式
│   └── 权衡考虑：构建速度 vs 跨平台兼容性
│
├── 包管理器统一
│   ├── 决策点：前端依赖管理工具选择
│   ├── 方案选择：Bun (统一使用)
│   ├── 实现方式：所有任务使用 bun 命令
│   └── 权衡考虑：性能 vs 生态兼容性
│
└── 任务依赖管理
    ├── 决策点：如何组织构建顺序
    ├── 方案选择：显式 deps 声明
    ├── 实现方式：Taskfile deps 机制
    └── 权衡考虑：清晰性 vs 灵活性
```

## 关键发现

- **关键节点**：`common:build:frontend` - 所有平台构建的核心依赖，包含前端依赖安装和绑定生成
- **关键节点**：平台特定的 `build` 任务 - 每个平台的构建入口点，包含 Native/Docker 条件选择
- **潜在问题**：Docker 交叉编译需要先运行 `setup:docker` 构建 wails-cross 镜像（~800MB）
- **潜在问题**：iOS 和 Android 构建需要特定的开发环境（Xcode、Android SDK）
- **优化建议**：考虑添加缓存机制加速重复构建

## 修改策略

### 高优先级
- **添加任务说明文档**：在根 Taskfile.yml 添加注释说明任务用途
- **统一错误处理**：为所有平台任务添加统一的 preconditions 检查

### 中优先级
- **优化 Docker 缓存**：添加 GO_CACHE_MOUNT 和 REPLACE_MOUNTS 的文档说明
- **添加清理任务**：在 common 中添加 clean 任务清理构建产物

### 低优先级
- **添加并行构建支持**：对于多架构构建考虑并行化
- **添加进度提示**：为长时间运行的任务添加进度提示

## 风险评估

- **高风险**：Docker 交叉编译失败可能导致所有非原生平台构建失败
- **中风险**：平台特定任务（iOS/Android）依赖外部工具链
- **低风险**：前端依赖安装失败（有明确的错误提示）

## 相关笔记

- [[bun-migration.md]] - Bun 包管理器迁移
- [[wails3-build-fix.md]] - Wails 3 构建问题修复
