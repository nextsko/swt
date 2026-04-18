import { Outlet } from 'react-router-dom'
import { useIsDesktop } from '../../lib/useIsDesktop'
import { StatusBar } from './StatusBar'
import { TabBar } from './TabBar'

/**
 * 移动应用脚手架：
 * - 顶部：仅桌面预览展示模拟 iPhone 状态栏（真机由系统提供）
 * - 中部：Outlet 容器（各页面通过 <Page> 组件内部实现 fixed 顶部栏 + 可滚动内容）
 * - 底部：TabBar 固定（flex-none）
 *
 * 关键：中部使用 relative + flex-1 min-h-0，允许 <Page> 使用 absolute inset-0 实现
 * 真正的全屏撑满 + 固定栏布局。
 */
export function MobileScaffold() {
    const isDesktop = useIsDesktop()
    return (
        <div className="h-full flex flex-col bg-[#F2F2F7]">
            {isDesktop && <StatusBar />}
            <main className="flex-1 min-h-0 relative">
                <Outlet />
            </main>
            <TabBar />
        </div>
    )
}

/**
 * 聊天详情等非 Tab 页面的脚手架（无 TabBar）
 */
export function DetailScaffold() {
    const isDesktop = useIsDesktop()
    return (
        <div className="h-full flex flex-col bg-[#F2F2F7]">
            {isDesktop && <StatusBar />}
            <main className="flex-1 min-h-0 relative">
                <Outlet />
            </main>
        </div>
    )
}
