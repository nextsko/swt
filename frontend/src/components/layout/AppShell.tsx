import { Outlet, useLocation } from 'react-router-dom'
import { useIsDesktop } from '../../lib/useIsDesktop'
import { TabBar } from './TabBar'

/**
 * AppShell: 响应式应用外壳
 *
 * 桌面端 (>= 768px): 双栏布局
 *   - 左栏 (w-80): 会话列表 + TabBar，始终可见
 *   - 右栏 (flex-1): 聊天详情 / 空状态提示
 *
 * 移动端 (< 768px): 单栏全屏
 *   - TabBar 页面正常展示
 *   - 聊天详情全屏覆盖（通过路由切换）
 */
export function AppShell() {
    const isDesktop = useIsDesktop()
    const location = useLocation()

    // 桌面端：是否在右栏展示聊天
    const isChatRoute = location.pathname.startsWith('/chat/')

    if (!isDesktop) {
        // 移动端：单栏 + TabBar
        return (
            <div className="h-full flex flex-col bg-[var(--bg-primary)]">
                <main className="flex-1 min-h-0 relative">
                    <Outlet />
                </main>
                <TabBar />
            </div>
        )
    }

    // 桌面端：双栏
    return (
        <div className="h-full flex bg-[var(--bg-primary)]">
            {/* 左栏：会话/联系人/发现/我的 */}
            <div className="w-80 flex flex-col border-r border-[var(--border)] shrink-0">
                <main className="flex-1 min-h-0 relative">
                    <Outlet />
                </main>
                <TabBar />
            </div>

            {/* 右栏：聊天详情 / 空状态 */}
            <div className="flex-1 min-h-0 relative">
                {isChatRoute ? (
                    <Outlet />
                ) : (
                    <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">
                        <div className="text-center p-8 rounded-3xl glass-panel">
                            <div className="text-[56px] mb-3 opacity-80">💬</div>
                            <div className="text-[15px] font-medium">选择一个对话开始聊天</div>
                            <div className="text-[13px] mt-1 opacity-60">从左侧列表选择联系人或会话</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * DetailScaffold: 详情页脚手架（聊天详情等）
 * 桌面端：直接渲染内容（右栏内）
 * 移动端：全屏覆盖，无 TabBar
 */
export function DetailScaffold() {
    const isDesktop = useIsDesktop()

    if (isDesktop) {
        // 桌面端：内容直接渲染在右栏
        return (
            <div className="h-full flex flex-col">
                <main className="flex-1 min-h-0 relative">
                    <Outlet />
                </main>
            </div>
        )
    }

    // 移动端：全屏覆盖
    return (
        <div className="h-full flex flex-col">
            <main className="flex-1 min-h-0 relative">
                <Outlet />
            </main>
        </div>
    )
}
