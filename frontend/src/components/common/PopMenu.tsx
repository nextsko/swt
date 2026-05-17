import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'

export interface PopMenuItem {
    key: string
    label: string
    icon?: React.ReactNode
    onClick: () => void
}

/**
 * 通用下拉菜单（右上角打开）。点击外部/Esc 关闭。
 */
export function PopMenu({
    open,
    onClose,
    items,
    anchor = 'top-right',
}: {
    open: boolean
    onClose: () => void
    items: PopMenuItem[]
    anchor?: 'top-right' | 'top-left'
}) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose()
        }
        const escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('mousedown', handler)
        document.addEventListener('keydown', escHandler)
        return () => {
            document.removeEventListener('mousedown', handler)
            document.removeEventListener('keydown', escHandler)
        }
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            ref={ref}
            className={cn(
                'absolute z-40 min-w-[160px] py-1.5 rounded-2xl glass-panel shadow-xl',
                anchor === 'top-right' ? 'right-3' : 'left-3',
            )}
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 48px)', backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)' }}
        >
            {items.map((it, idx) => (
                <button
                    key={it.key}
                    className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[var(--text-primary)] active:bg-[var(--accent)]/10 transition-colors duration-150',
                        idx > 0 && 'border-t border-[var(--border)]',
                    )}
                    onClick={() => {
                        onClose()
                        it.onClick()
                    }}
                >
                    {it.icon}
                    <span>{it.label}</span>
                </button>
            ))}
        </div>
    )
}
