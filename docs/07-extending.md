---
tags:
  - wails3
  - extending
  - guide
  - development
aliases:
  - 扩展指南
  - 定制指南
created: 2026-04-18
updated: 2026-04-18
status: active
---

# 扩展指南

> 如何扩展和定制此模板

## 🎨 UI 扩展

### 添加新页面

使用 React Router：

```bash
cd frontend
bun add react-router-dom
```

```typescript
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### 添加 UI 组件库

```bash
# shadcn/ui
bun add @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# Lucide Icons
bun add lucide-react
```

## 🔧 功能扩展

### 添加数据库支持

```bash
go get gorm.io/gorm
go get gorm.io/driver/sqlite
```

```go
// database.go
import (
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

type Database struct {
    db *gorm.DB
}

func NewDatabase() (*Database, error) {
    db, err := gorm.Open(sqlite.Open("app.db"), &gorm.Config{})
    if err != nil {
        return nil, err
    }
    return &Database{db: db}, nil
}
```

### 添加配置管理

```bash
go get github.com/spf13/viper
```

### 添加日志系统

```bash
go get go.uber.org/zap
```

## 📚 更多资源

- [FAQ](./FAQ.md)
- [踩坑记录](./PITFALLS.md)
- [最佳实践](./BEST_PRACTICES.md)
