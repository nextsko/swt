import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Forward, Quote, Trash2, Undo2 } from 'lucide-react'
import { cn } from '../../lib/cn'

export type BubbleAction =
    | 'copy'
    | 'quote'
    | 'forward'
    | 'recall'
    | 'delete'

interface MenuEntry {
    key: BubbleAction
    label: string
    icon: React.ComponentType<{ className?: string }>
    danger?: boolean
}

/**
 * BubbleMenu：长按消息气泡后弹出的浮层菜单。
 * - 屏幕遮罩 + 菜单居中气泡上方/下方
 * - 支持键盘 Esc / 点击遮罩关闭
 *
 * 仅负责渲染与事件分发，动作实际执行交给父组件。
 */
export function BubbleMenu({
    open,
    anchorRect,
    isSelf,
    onAction,
    onClose,
}: {
    open: boolean
    anchorRect: DOMRect | null
    isSelf: boolean
    onAction: (action: BubbleAction) => void
    onClose: () => void
}) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

    // 根据气泡位置计算菜单位置：优先气泡上方
    useLayoutEffect(() => {
        if (!open || !anchorRect) return
        const menuEl = menuRef.current
        if (!menuEl) return
        const menuW = menuEl.offsetWidth
        const menuH = menuEl.offsetHeight
        const viewportH = window.innerHeight
        const above = anchorRect.top - menuH - 8 > 16
        const top = above ? anchorRect.top - menuH - 8 : Math.min(anchorRect.bottom + 8, viewportH - menuH - 16)
        let left = anchorRect.left + anchorRect.width / 2 - menuW / 2
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

    const entries: MenuEntry[] = [
        { key: 'copy', label: '复制', icon: Copy },
        { key: 'quote', label: '引用', icon: Quote },
        { key: 'forward', label: '转发', icon: Forward },
        ...(isSelf ? [{ key: 'recall' as const, label: '撤回', icon: Undo2 }] : []),
        { key: 'delete', label: '删除', icon: Trash2, danger: true },
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
                className="absolute min-w-[160px] py-1 bg-[#1C1C1E] rounded-xl shadow-2xl"
                style={
                    pos
                        ? { top: pos.top, left: pos.left }
                        : { top: -9999, left: -9999, visibility: 'hidden' }
                }
                onClick={(e) => e.stopPropagation()}
            >
                {entries.map((it, idx) => (
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

/**
 * Hook：给气泡绑定 long-press 检测，500ms 触发。
 */
export function useLongPress(onTrigger: (rect: DOMRect) => void, delay = 500) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const targetRef = useRef<HTMLElement | null>(null)

    // 组件卸载时清除定时器
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
                timerRef.current = null
            }
        }
    }, [])

    const start = (el: HTMLElement) => {
        targetRef.current = el
        if (timerRef.current) window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => {
            if (targetRef.current) {
                onTrigger(targetRef.current.getBoundingClientRect())
            }
        }, delay)
    }
    const cancel = () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    return {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
            // 只响应鼠标左键 / 触摸
            if (e.pointerType === 'mouse' && e.button !== 0) return
            start(e.currentTarget)
        },
        onPointerUp: cancel,
        onPointerLeave: cancel,
        onPointerCancel: cancel,
        onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => {
            // 桌面右键模拟
            e.preventDefault()
            onTrigger(e.currentTarget.getBoundingClientRect())
        },
    }
}
