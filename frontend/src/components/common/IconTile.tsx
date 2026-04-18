import { icons, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface IconTileProps {
  /** Lucide 图标名（如 "MessageCircle"） */
  icon: string | LucideIcon
  /** 图标颜色的 Tailwind 类，如 text-green-500 */
  iconColor?: string
  /** 底色 Tailwind 类 */
  bgColor?: string
  size?: number
  className?: string
}

/**
 * IconTile 圆角彩色图标块（如联系人顶部三项、发现 Tab 功能入口等）
 */
export function IconTile({
  icon,
  iconColor = 'text-white',
  bgColor,
  size = 28,
  className,
}: IconTileProps) {
  const Icon: LucideIcon =
    typeof icon === 'string' ? (icons[icon as keyof typeof icons] ?? icons.Circle) : icon

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg flex-none',
        bgColor,
        className,
      )}
      style={{ width: size + 14, height: size + 14 }}
    >
      <Icon className={cn(iconColor)} style={{ width: size, height: size }} strokeWidth={2} />
    </div>
  )
}
