import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * 信息/设置类列表的分组白底容器，带圆角、外间距
 */
export function SectionGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-white', className)}>
      <div className="divide-y divide-[#E5E5EA]">{children}</div>
    </div>
  )
}

/**
 * 通用列表行：左侧 icon/头像，中间标题+副标题，右侧箭头/时间
 */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  className,
}: {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 active:bg-[#F2F2F7] cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {leading}
      <div className="flex-1 min-w-0">
        <div className="text-[17px] text-[#08060d] font-medium leading-tight truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-[13px] text-[#8E8E93] mt-1 leading-tight truncate">
            {subtitle}
          </div>
        )}
      </div>
      {trailing && <div className="flex-none text-[#8E8E93] text-[12px]">{trailing}</div>}
    </div>
  )
}
