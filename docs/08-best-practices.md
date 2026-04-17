---
tags:
  - wails3
  - best-practices
  - guide
  - development
aliases:
  - 最佳实践
  - 代码规范
created: 2026-04-18
updated: 2026-04-18
status: active
---

# 最佳实践

> 推荐的开发实践和代码规范

## 🏗️ 项目结构

### Go 代码组织

```text
myapp/
├── main.go              # 应用入口
├── services/            # 业务服务
│   ├── greet.go
│   └── database.go
├── models/              # 数据模型
│   └── user.go
└── utils/               # 工具函数
    └── helpers.go
```

### 前端代码组织

```
frontend/src/
├── components/          # 可复用组件
│   ├── Button.tsx
│   └── Card.tsx
├── pages/              # 页面组件
│   ├── Home.tsx
│   └── Settings.tsx
├── hooks/              # 自定义 Hooks
│   └── useGreet.ts
├── utils/              # 工具函数
│   └── format.ts
└── types/              # TypeScript 类型
    └── global.d.ts
```

## 🔒 安全实践

1. **不要在代码中硬编码密钥**
2. **使用环境变量存储敏感信息**
3. **验证所有用户输入**
4. **使用 HTTPS 进行网络请求**

## ⚡ 性能优化

1. **使用 React.memo 避免不必要的重渲染**
2. **延迟加载非关键资源**
3. **使用生产构建**
4. **启用代码分割**

## 📝 代码规范

### Go 代码

- 使用 `gofmt` 格式化代码
- 遵循 Go 命名约定
- 添加适当的注释
- 处理所有错误

### TypeScript 代码

- 使用 ESLint 检查代码
- 启用严格模式
- 使用类型而不是 any
- 遵循 React Hooks 规则

## 🧪 测试

### Go 测试

```go
func TestGreet(t *testing.T) {
    service := NewGreetService()
    result := service.Greet("World")
    expected := "Hello World!"
    if result != expected {
        t.Errorf("Expected %s, got %s", expected, result)
    }
}
```

### 前端测试

```bash
bun add -D vitest @testing-library/react
```

## 📚 更多资源

- [FAQ](./FAQ.md)
- [踩坑记录](./PITFALLS.md)
- [扩展指南](./EXTENDING.md)
