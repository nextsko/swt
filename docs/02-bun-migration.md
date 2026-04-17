---
tags:
  - bun
  - package-manager
  - migration
  - wails3
aliases:
  - Bun 包管理器迁移
  - 从 npm 迁移到 Bun
created: 2026-04-18
updated: 2026-04-18
status: active
---

> [!abstract] 概述
> 将 Wails 3 项目从 npm 迁移到 Bun 包管理器，包括修改构建配置、清理其他包管理器引用和验证迁移结果。

## 操作流程

1. **搜索项目中所有 npm 引用**
   - 使用 grep 搜索包含 "npm" 的文件
   - 识别需要修改的配置文件

2. **修改构建配置文件**
   - `build/Taskfile.yml` - 将 npm 命令替换为 bun
   - `build/docker/Dockerfile.cross` - 移除 nodejs/npm 依赖，改用 bun
   - `frontend/.gitignore` - 更新日志文件配置

3. **删除 npm 锁文件**
   - 删除 `frontend/package-lock.json`
   - 保留 `frontend/bun.lock`

4. **更新文档**
   - `docs/PITFALLS.md` - 更新说明项目使用 Bun
   - 清理其他包管理器（yarn、pnpm、lerna）的日志配置

5. **验证迁移**
   - 搜索确认无剩余 npm 命令引用
   - 测试前端构建

## 关键资料

- Bun 官方文档：https://bun.sh/docs/installation
- Wails 3 文档：https://v3.wails.io/
- 项目文档：`docs/PITFALLS.md`、`docs/FAQ.md`

## 代码片段

### 修改 build/Taskfile.yml

```yaml
# 安装前端依赖
install:frontend:deps:
  summary: Install frontend dependencies
  dir: frontend
  sources:
    - package.json
    - bun.lock  # ✅ 使用 bun.lock
  generates:
    - node_modules
  preconditions:
    - sh: command -v bun || bun --version
      msg: "Looks like bun isn't installed. Install bun from: https://bun.sh/docs/installation"
  cmds:
    - bun install  # ✅ 使用 bun

# 构建前端
build:frontend:
  cmds:
    - bun run {{.BUILD_COMMAND}}  # ✅ 使用 bun

# 开发模式
dev:frontend:
  cmds:
    - bun run dev -- --port {{.VITE_PORT}} --strictPort  # ✅ 使用 bun
```

### 修改 build/docker/Dockerfile.cross

```dockerfile
# 移除 nodejs 和 npm
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl xz-utils pkg-config gcc libc6-dev \
    libgtk-3-dev libwebkit2gtk-4.1-dev \
    libgtk-4-dev libwebkitgtk-6.0-dev \
    && rm -rf /var/lib/apt/lists/*

# 使用 bun 构建前端
(cd frontend && bun install --silent && bun run build --silent)
```

### 修改 frontend/.gitignore

```gitignore
# Logs
logs
*.log
bun-debug.log*  # ✅ 只保留 bun
# yarn-debug.log*  # ❌ 删除
# pnpm-debug.log*  # ❌ 删除
```

## 修改文件清单

- `build/Taskfile.yml` - npm → bun
- `build/docker/Dockerfile.cross` - 移除 nodejs/npm，改用 bun
- `frontend/.gitignore` - 清理其他包管理器日志配置
- `frontend/package-lock.json` - 删除
- `docs/PITFALLS.md` - 更新说明

## 相关笔记

- [[wails3-build-fix]] - Wails 3 构建问题修复
- [[taskfile-architecture]] - Taskfile 架构分析
