---
tags:
  - wails3
  - template
  - guide
  - development
aliases:
  - 模板创建指南
  - 模板开发
created: 2026-04-18
updated: 2026-04-18
status: active
---

# 模板创建指南

> 如何创建和发布 Wails3 自定义模板

## 📦 创建模板

### 1. 生成模板基础结构

```bash
wails3 generate template \
  -name "my-template" \
  -author "Your Name" \
  -description "Template description" \
  -helpurl "https://github.com/username/template" \
  -version "v1.0.0"
```

### 2. 添加前端项目

**方式一：使用现有前端**
```bash
wails3 generate template -name mytemplate -frontend ./my-frontend
```

**方式二：手动复制**
```bash
rm -rf mytemplate/frontend
cp -r your-configured-frontend mytemplate/frontend
```

### 3. 配置构建脚本

编辑 `build/Taskfile.tmpl.yml`：

```yaml
install:frontend:deps:
  preconditions:
    - sh: bun --version
  cmds:
    - bun install

generate:bindings:
  cmds:
    - wails3 generate bindings -ts -f {{ "'{{.BUILD_FLAGS}}'" }} -clean=true
```

### 4. 处理 MSIX 文件

**重要：** 包含 package 阶段变量的文件不应该有 `.tmpl` 扩展名：

```bash
# 重命名这些文件
mv build/windows/msix/app_manifest.xml.tmpl build/windows/msix/app_manifest.xml
mv build/windows/msix/template.xml.tmpl build/windows/msix/template.xml
```

## 🧪 测试模板

### 本地测试

```bash
# 创建测试项目
wails3 init -n test-project -t ./my-template

# 测试构建
cd test-project
wails3 build

# 测试开发模式
wails3 dev
```

## 🚀 发布模板

### 1. 推送到 GitHub

```bash
cd my-template
git init
git add .
git commit -m "Initial commit"

# 使用 gh CLI 创建仓库
gh repo create my-template --private --source=. --push
```

### 2. 创建版本标签

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 3. 使用模板

```bash
# 克隆后使用
git clone https://github.com/username/my-template.git
wails3 init -n myapp -t ./my-template
```

## 📝 模板变量

### Init 阶段可用

- `Name`, `BinaryName`, `ProductName`
- `ProductDescription`, `ProductVersion`
- `ProductCompany`, `ProductCopyright`
- `ProductComments`, `ProductIdentifier`
- `Typescript`, `WailsVersion`

### Package 阶段可用

- `Publisher`, `ProcessorArchitecture`
- `FileAssociations`, `Protocols`
- `ExecutablePath`, `OutputPath`

## 💡 最佳实践

1. **查看官方文档** - 不要自己发明解决方案
2. **理解变量作用域** - Init vs Package 阶段
3. **测试多平台** - Windows、macOS、Linux
4. **提供完整文档** - README、FAQ、示例
5. **保持更新** - 定期更新依赖和 Wails 版本

## 📚 相关资源

- [Wails v3 文档](https://v3.wails.io/)
- [踩坑记录](./PITFALLS.md)
- [FAQ](./FAQ.md)
- [扩展指南](./EXTENDING.md)
