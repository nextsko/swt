import { cn } from '../../lib/cn'

/**
 * 未读消息红点，支持数字展示
 */
export function Badge({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  if (count <= 0) return null
  const display = count > 99 ? '99+' : String(count)
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[var(--danger)] text-white text-[11px] font-semibold leading-none shadow-sm',
        className,
      )}
    >
      {display}
    </span>
  )
}
