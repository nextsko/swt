---
tags:
  - wails3
  - android
  - webview
  - jni
  - debugging
  - crash
aliases:
  - Android 交互闪退修复
  - POST body 转发
created: 2026-04-18
updated: 2026-04-18
status: active
---

> [!abstract] 概述
> 修复 Wails 3 Android 应用点击交互后闪退的问题。根本原因是 Android WebView 的 `shouldInterceptRequest` 无法读取 POST body，导致 Go 侧 `io.Copy(buf, r.Body)` 在 nil body 上触发 panic。通过注入 JS 将 POST body 转为 URL query params 解决。

## 问题现象

用户点击前端按钮触发 Go 方法调用后，应用崩溃退出：

```text
Wails App 因自身问题闪退
#00 pc 0000000000665248  libwails.so (runtime.raise.abi0+40)
```

## 根因分析

### 1. 调试方法

在 `serveAssetForAndroid` 中添加 `recover()` 并打印完整堆栈：

```go
defer func() {
    if r := recover(); r != nil {
        stack := debug.Stack()
        androidLogf("error", "🤖 [serveAssetForAndroid] PANIC: %v", r)
        for i, line := range strings.Split(string(stack), "\n") {
            androidLogf("error", "🤖 [stack %d] %s", i, line)
        }
        err = fmt.Errorf("panic in serveAssetForAndroid: %v", r)
    }
}()
```

### 2. 捕获到堆栈

```text
bytes.(*Buffer).ReadFrom(0x43caea6510, {0x0, 0x0})
    bytes/buffer.go:229
io.copyBuffer({...}, {0x0, 0x0}, {...})
    io/io.go:415
io.Copy({...}, {0x0?, 0x0?})
    io/io.go:388
(*HTTPTransport).handleRuntimeRequest(...)
    transport_http.go:104  ← r.Body 是 nil
```

### 3. 根本原因

**三层问题叠加**：

1. **Android WebView 限制**: `shouldInterceptRequest` API 无法读取 POST body（Android 官方限制）
2. **Go 构造的请求 body 为 nil**: `http.NewRequest("GET", url, nil)` 产生 `Body = nil` 的 Request
3. **Content-Type 硬编码**: Java 侧对所有 `/wails/*` 响应硬编码 `application/json`，但 Go 可能返回 `text/plain`

## 解决方案

### 修复 1: Go 侧避免 nil body 崩溃

**文件**: `vendor/.../application_android.go`

```go
// 修改前
req, err := http.NewRequest("GET", fullURL, nil)

// 修改后
req, err := http.NewRequest("GET", fullURL, http.NoBody)
```

### 修复 2: JS 注入将 POST body 转为 URL query params

**文件**: `build/android/app/src/main/java/com/wails/app/MainActivity.java`

在 `onPageFinished` 中注入 `fetch` 覆盖函数：

```java
String fetchOverride =
    "(function() {" +
    "  if (window.__wailsFetchPatched) return;" +
    "  window.__wailsFetchPatched = true;" +
    "  const origFetch = window.fetch;" +
    "  window.fetch = function(input, init) {" +
    "    try {" +
    "      let urlStr = '';" +
    "      if (typeof input === 'string') urlStr = input;" +
    "      else if (input instanceof URL) urlStr = input.toString();" +
    "      else if (input && input.url) urlStr = input.url;" +
    "      if (urlStr.indexOf('/wails/runtime') !== -1 && init && init.method === 'POST' && init.body) {" +
    "        const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;" +
    "        const u = new URL(urlStr, window.location.origin);" +
    "        if (body.object !== undefined) u.searchParams.set('object', String(body.object));" +
    "        if (body.method !== undefined) u.searchParams.set('method', String(body.method));" +
    "        if (body.args !== undefined) u.searchParams.set('args', JSON.stringify(body.args));" +
    "        return origFetch(u.toString(), { method: 'POST', headers: init.headers });" +
    "      }" +
    "    } catch (e) { console.error('[fetch-patch] error:', e); }" +
    "    return origFetch(input, init);" +
    "  };" +
    "})();";
webView.evaluateJavascript(fetchOverride, null);
```

Go 端 `transport_http.go` 已有 fallback 逻辑处理 query params：

```go
if buf.Len() > 0 {
    // parse body
} else {
    // fallback: parse query params
    query := r.URL.Query()
    if objStr := query.Get("object"); objStr != "" { ... }
}
```

### 修复 3: 根据响应内容检测 Content-Type

**文件**: `MainActivity.java`

```java
// 根据首字节判断 JSON 或 text/plain
String mimeType = "text/plain";
if (data.length > 0) {
    byte b = data[0];
    if (b == '{' || b == '[' || b == '"' || b == 't' || b == 'f' || b == 'n' ||
        (b >= '0' && b <= '9') || b == '-') {
        mimeType = "application/json";
    }
}
```

### 修复 4: 添加 PanicHandler 防止 os.Exit

**文件**: `main.go`

```go
app := application.New(application.Options{
    // ...
    PanicHandler: func(p *application.PanicDetails) {
        log.Printf("PANIC: %v\n%s\nFullStack:\n%s",
            p.Error, p.StackTrace, p.FullStackTrace)
    },
})
```

避免默认 `defaultPanicHandler` 调用 `os.Exit(1)` 导致整个应用被杀死。

## 验证流程

### 1. 调试日志输出

```text
✅ [fetch-patch] installed
✅ [fetch-patch] url: https://wails.localhost/wails/runtime method: POST
✅ [fetch-patch] rewrite to: .../wails/runtime?object=0&method=0&args=...
✅ [Android/debug] nativeServeAsset: POST /wails/runtime?object=0&method=0&args=...
✅ [Android/debug] Serving asset /wails/runtime?... (17 bytes)
```

### 2. 前端正常显示结果

点击 Greet 按钮后返回 `"Hello xxx!"`，无 JSON 解析错误。

## 关键资料

- **Android WebView shouldInterceptRequest 限制**: https://developer.android.com/reference/android/webkit/WebViewClient#shouldInterceptRequest
- **StackOverflow: WebView POST body**: https://stackoverflow.com/questions/19449692
- **Wails v3 HTTPTransport**: `vendor/.../pkg/application/transport_http.go`

## 代码片段

### 完整的 serveAssetForAndroid 修复（带 recover）

```go
func serveAssetForAndroid(app *App, path string) (data []byte, err error) {
    // Recover from panics to log full stack trace instead of crashing
    defer func() {
        if r := recover(); r != nil {
            stack := debug.Stack()
            androidLogf("error", "🤖 [serveAssetForAndroid] PANIC: %v", r)
            for i, line := range strings.Split(string(stack), "\n") {
                androidLogf("error", "🤖 [stack %d] %s", i, line)
            }
            err = fmt.Errorf("panic in serveAssetForAndroid: %v", r)
        }
    }()
    // ... rest of function

    req, err := http.NewRequest("GET", fullURL, http.NoBody)  // 使用 NoBody 避免 nil
    // ...
}
```

## 相关笔记

- [[14-android-main-entry-fix]] - Android 主入口函数修复
- [[13-remove-system-tray-and-fix-android-build]] - 移除系统托盘
- [[12-wails3-android-build-fix]] - Wails 3 Android 构建修复

## 注意事项

> [!warning] Android WebView 固有限制
> Android WebView 的 `WebResourceRequest` 不提供 POST body 的访问方式。这是 Android API 的固有限制，无法直接通过修改 Java 代码解决。必须在 JS 层将数据编码到 URL 或使用 `@JavascriptInterface` 桥接。

> [!tip] 调试 Go panic on Android
> Go 的 panic stack trace 默认输出到 stderr，Android 不会捕获。必须：
>
> 1. 在关键入口函数添加 `defer func() { if r := recover(); r != nil {...} }()`
> 2. 使用 `debug.Stack()` 获取堆栈
> 3. 用 `androidLogf` 或 `__android_log_print` 逐行输出到 logcat

> [!danger] 避免 os.Exit
> Wails 的 `defaultPanicHandler` 会调用 `os.Exit(1)`，在 Android 上会直接杀死应用。务必通过 `Options.PanicHandler` 自定义处理器。

> [!info] Wails v3 alpha 不完整支持
> 本次修复涉及 4 个文件的修改，属于 Wails v3 alpha Android 支持的补丁。建议：
>
> 1. 提交 PR 到 Wails 项目
> 2. 或在 `go.mod` 中使用 `replace` 指令指向 fork 版本
