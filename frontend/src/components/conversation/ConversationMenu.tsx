import { Bell, BellOff, Pin, Trash2 } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

export type ConversationMenuAction = 'toggle-pin' | 'toggle-mute' | 'delete'

export function ConversationMenu({
    open,
    anchorRect,
    pinned,
    muted,
    onAction,
    onClose,
}: {
    open: boolean
    anchorRect: DOMRect | null
    pinned: boolean
    muted: boolean
    onAction: (action: ConversationMenuAction) => void
    onClose: () => void
}) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

    useLayoutEffect(() => {
        if (!open || !anchorRect) return
        const menuEl = menuRef.current
        if (!menuEl) return
        const menuW = menuEl.offsetWidth
        const menuH = menuEl.offsetHeight
        const viewportH = window.innerHeight
        const above = anchorRect.top - menuH - 8 > 16
        const top = above ? anchorRect.top - menuH - 8 : Math.min(anchorRect.bottom + 8, viewportH - menuH - 16)
        let left = anchorRect.right - menuW
        left = Math.max(8, Math.min(left, window.innerWidth - menuW - 8))
        setPos({ top, left })
    }, [open, anchorRect])

    useEffect(() => {
        if (!open) return
        const esc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', esc)
        return () => document.removeEventListener('keydown', esc)
    }, [open, onClose])

    if (!open || !anchorRect) return null

    const items = [
        {
            key: 'toggle-pin' as const,
            label: pinned ? '取消置顶' : '置顶',
            icon: Pin,
        },
        {
            key: 'toggle-mute' as const,
            label: muted ? '关闭免打扰' : '消息免打扰',
            icon: muted ? Bell : BellOff,
        },
        {
            key: 'delete' as const,
            label: '删除会话',
            icon: Trash2,
            danger: true,
        },
    ]

    return createPortal(
        <div
            className="fixed inset-0 z-[60]"
            onClick={onClose}
            onContextMenu={(e) => {
                e.preventDefault()
                onClose()
            }}
        >
            <div
                ref={menuRef}
                className="absolute min-w-[168px] py-1 bg-[#1C1C1E] rounded-xl shadow-2xl"
                style={
                    pos
                        ? { top: pos.top, left: pos.left }
                        : { top: -9999, left: -9999, visibility: 'hidden' }
                }
                onClick={(e) => e.stopPropagation()}
            >
                {items.map((it, idx) => (
                    <button
                        key={it.key}
                        className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-[14px] active:bg-white/10',
                            it.danger ? 'text-[#FF453A]' : 'text-white',
                            idx > 0 && 'border-t border-white/10',
                        )}
                        onClick={() => {
                            onAction(it.key)
                            onClose()
                        }}
                    >
                        <it.icon className="w-4 h-4" />
                        <span>{it.label}</span>
                    </button>
                ))}
            </div>
        </div>,
        document.body,
    )
}
