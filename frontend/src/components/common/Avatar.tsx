import { useMemo } from 'react'
import { cn } from '../../lib/cn'

interface AvatarProps {
  src?: string
  name?: string
  size?: number
  className?: string
  rounded?: 'rounded' | 'square'
}

/**
 * Avatar 组件：支持图片 URL、文字占位符、四边形 / 圆角样式
 */
export function Avatar({
  src,
  name,
  size = 44,
  className,
  rounded = 'rounded',
}: AvatarProps) {
  const initials = useMemo(() => {
    if (!name) return ''
    return name.trim().charAt(0)
  }, [name])

  const radius = rounded === 'rounded' ? 'rounded-lg' : 'rounded-md'

  if (!src) {
    return (
      <div
        className={cn(
          radius,
          'bg-slate-300 text-slate-700 flex items-center justify-center font-medium',
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {initials || '?'}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name || 'avatar'}
      className={cn(radius, 'object-cover bg-slate-200 flex-none', className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}

/**
 * GroupAvatar：群聊九宫格（最多展示 4 张）
 */
export function GroupAvatar({
  avatars,
  size = 44,
  className,
}: {
  avatars?: string[]
  size?: number
  className?: string
}) {
  const list = (avatars ?? []).slice(0, 4)
  while (list.length < 4) list.push('')
  const cellSize = Math.floor((size - 2) / 2)

  return (
    <div
      className={cn('grid grid-cols-2 gap-[1px] bg-slate-200 rounded-lg overflow-hidden flex-none', className)}
      style={{ width: size, height: size }}
    >
      {list.map((url, i) =>
        url ? (
          <img
            key={i}
            src={url}
            alt="member"
            className="object-cover bg-slate-100"
            style={{ width: cellSize, height: cellSize }}
            draggable={false}
          />
        ) : (
          <div
            key={i}
            className="bg-slate-100"
            style={{ width: cellSize, height: cellSize }}
          />
        ),
      )}
    </div>
  )
}
