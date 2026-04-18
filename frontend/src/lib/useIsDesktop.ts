import { useEffect, useState } from 'react'

/**
 * useIsDesktop - 响应式检测当前视窗是否为桌面尺寸 (>= 600px)
 * 用于 DeviceFrame 与 StatusBar 等组件决定是否展示桌面专属模拟 UI
 */
export function useIsDesktop(breakpoint = 600): boolean {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= breakpoint : true,
  )
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= breakpoint)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])
  return isDesktop
}
