import { type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { useIsDesktop } from '../../lib/useIsDesktop'

/**
 * DeviceFrame：
 * - 桌面 (>= 600px) 将应用渲染在 420x900 iPhone 风格圆角框内，居中展示
 * - 移动端 (< 600px) 全屏填充
 *
 * 关键：mobile 使用 h-dvh（动态视窗高度）+ overflow-hidden，保证子元素 h-full 能
 * 正确沿袭 100% 高度，且键盘弹出时视窗会自动收缩。
 */
export function DeviceFrame({ children }: { children: ReactNode }) {
    const isDesktop = useIsDesktop()
    if (!isDesktop) {
        return (
            <div className="relative w-full h-dvh overflow-hidden bg-[#F2F2F7]">
                {children}
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 p-6">
            <div
                className={cn(
                    'relative w-[420px] h-[900px] bg-black rounded-[48px] shadow-2xl',
                    'p-[14px] overflow-hidden',
                )}
            >
                {/* 灵动岛 */}
                <div className="absolute left-1/2 top-[20px] -translate-x-1/2 h-[26px] w-[110px] bg-black rounded-full z-30" />
                {/* 屏幕内容区 */}
                <div className="relative w-full h-full rounded-[36px] overflow-hidden bg-[#F2F2F7]">
                    {children}
                </div>
            </div>
        </div>
    )
}
