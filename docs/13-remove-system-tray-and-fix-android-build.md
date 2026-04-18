---
tags:
  - wails3
  - system-tray
  - android
  - taskfile
  - fix
aliases:
  - 移除系统托盘配置
  - 修复 Android 构建
created: 2026-04-18
updated: 2026-04-18
status: active
---

> [!abstract] 概述
> 将 Wails 3 应用从系统托盘应用改为普通桌面应用，并修复 Android 构建的 Taskfile 配置问题。

## 操作流程

### 1. 移除系统托盘配置

修改 `main.go`：

```go
// 移除系统托盘初始化代码
// 移除 runtime 和 icons 导入
// 简化窗口配置
```

### 2. 移除前端托盘控制

修改 `frontend/src/App.tsx`：

```tsx
// 删除 handleHideToTray 函数
// 删除 handleQuitApp 函数
// 删除 System Tray Controls 区域
// 更新描述为 "Desktop application"
// 移除底部托盘提示
```

### 3. 修复 Taskfile Android 构建

修改 `build/android/Taskfile.yml`：

```yaml
assemble:apk:
  summary: Assembles the APK using Gradle
  dir: .
  cmds:
    - ./gradlew.bat assembleDebug
    - cp app/build/outputs/apk/debug/app-debug.apk ../../bin/swt.apk
```

### 4. 配置 Android SDK 路径

创建 `build/android/local.properties`：

```properties
sdk.dir=C:/Android/sdk
ndk.dir=C:/Android/sdk/ndk/26.1.10909125
```

### 5. 手动构建 APK

```powershell
cd build/android
.\gradlew.bat assembleDebug
Copy-Item app\build\outputs\apk\debug\app-debug.apk ..\..\bin\swt.apk
```

## 关键资料

- **Wails v3 文档**: https://v3alpha.wails.io/
- **Task 文档**: https://taskfile.dev/

## 代码片段

### main.go 修改

```go
package main

import (
	"changeme/backend"
	"embed"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

var quitSignal = make(chan bool)

func init() {
	application.RegisterEvent[string]("time")
}

func main() {
	app := application.New(application.Options{
		Name:        "swt",
		Description: "A swt application",
		Services: []application.Service{
			application.NewService(backend.NewGreetService()),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "swt",
		Width:            1024,
		Height:           768,
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
	})

	// Time events goroutine
	go func() {
		for {
			now := time.Now().Format(time.RFC1123)
			app.Event.Emit("time", now)
			time.Sleep(time.Second)
		}
	}()

	// Listen for quit signal from frontend
	go func() {
		<-quitSignal
		app.Quit()
	}()

	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
```

### App.tsx 修改

```tsx
function App() {
  const [name, setName] = useState('')
  const [greeting, setGreeting] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (window.runtime?.Events) {
      window.runtime.Events.On('time', (data: any) => {
        setTime(data.data)
      })
    }
  }, [])

  const handleGreet = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const result = await GreetService.Greet(name)
      setGreeting(result)
    } catch (error) {
      console.error('Error greeting:', error)
      setGreeting('Error: Could not greet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Wails Helper App
          </h1>
          <p className="text-slate-300 text-lg">
            Desktop application with React + Tailwind CSS
          </p>
        </header>

        <main className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 p-8">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-6 text-center">Greeting Service</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && handleGreet()}
                />
                <button
                  onClick={handleGreet}
                  disabled={loading || !name.trim()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Greeting...' : 'Greet'}
                </button>
                {greeting && (
                  <div className="mt-4 p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                    <p className="text-center text-lg">{greeting}</p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-center">Live Time</h2>
              <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                <p className="text-center text-lg font-mono">
                  {time || 'Waiting for time events...'}
                </p>
              </div>
            </section>
          </div>
        </main>

        <footer className="mt-12 text-center text-slate-400">
          <p className="text-sm">
            Built with Wails v3 • React • TypeScript • Tailwind CSS v4
          </p>
        </footer>
      </div>
    </div>
  )
}
```

## 相关笔记

- [[12-wails3-android-build-fix]] - Wails 3 Android 构建修复
- [[11-android-build-errors]] - Wails 3 Android 构建错误

## 注意事项

> [!warning] Taskfile 目录上下文
> Taskfile 的 `dir` 选项是相对于 Taskfile 所在目录的。当 Taskfile 位于 `build/android/Taskfile.yml` 时，使用 `dir: .` 表示从该目录执行任务。

> [!tip] 手动构建替代方案
> 如果 Taskfile 配置遇到问题，可以直接在 `build/android` 目录运行 Gradle 命令：
> ```powershell
> .\gradlew.bat assembleDebug
> Copy-Item app\build\outputs\apk\debug\app-debug.apk ..\..\bin\swt.apk
> ```

## 构建结果

- **APK 位置**: `bin/swt.apk`
- **大小**: 14.1 MB
- **架构**: arm64-v8a
- **应用类型**: 普通桌面应用（非系统托盘）
