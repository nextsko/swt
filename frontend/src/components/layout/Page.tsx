import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Page: 单页面通用骨架
 * - header 固定在顶部（不随内容滚动）
 * - footer 固定在底部（可选，用于聊天详情输入栏等）
 * - 中间 children 区域独立滚动
 *
 * 所有 Tab 页和详情页都应通过本组件实现"固定栏 + 可滚动内容"结构
 */
export function Page({
  header,
  footer,
  children,
  className,
  contentClassName,
}: {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <div className={cn('absolute inset-0 flex flex-col bg-[var(--bg-primary)]', className)}>
      {header ? <div className="flex-none">{header}</div> : null}
      <div
        className={cn(
          'flex-1 min-h-0 overflow-y-auto overscroll-contain',
          contentClassName,
        )}
      >
        {children}
      </div>
      {footer ? <div className="flex-none">{footer}</div> : null}
    </div>
  )
}
