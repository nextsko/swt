import { Signal, Wifi, Battery } from 'lucide-react'

/**
 * 模拟 iPhone 状态栏（桌面预览专用），用于和截图视觉对齐。
 */
export function StatusBar({ time = '08:29' }: { time?: string }) {
  return (
    <div className="flex items-center justify-between px-6 pt-2 h-11 text-white bg-[#2196F3] text-[15px] font-semibold">
      <div>{time}</div>
      <div className="flex items-center gap-1">
        <Signal className="w-3.5 h-3.5" strokeWidth={2.5} />
        <Wifi className="w-4 h-4" strokeWidth={2.5} />
        <Battery className="w-5 h-5" strokeWidth={2} />
      </div>
    </div>
  )
}
