import { AlertCircle, Check, CheckCheck, Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { Message, MessageStatus } from '../../types'

/**
 * MessageStatusTick: 自己发送消息的状态标识。
 * - sending: 转圈
 * - sent: 单勾（灰）
 * - delivered: 双勾（灰）
 * - read: 双勾（蓝/浅蓝）
 * - failed: 红色感叹号
 * 群聊时可选展示"已读 N/M"。
 */
export function MessageStatusTick({
    message,
    groupSize,
    onSelfBubble,
}: {
    message: Message
    /** 若为群聊消息，传入群人数（含 self），会显示"已读 N/M" */
    groupSize?: number
    /** 是否在蓝色气泡上（决定配色） */
    onSelfBubble?: boolean
}) {
    if (!message.isSelf) return null
    const status = message.status as MessageStatus | undefined

    if (groupSize && groupSize > 2) {
        const readCount = message.readBy?.length ?? 0
        if (status === 'failed') {
            return <IconFailed />
        }
        if (status === 'sending') {
            return <IconSending onSelfBubble={onSelfBubble} />
        }
        return (
            <span
                className={cn(
                    'text-[10px] leading-none',
                    onSelfBubble ? 'text-white/80' : 'text-[var(--text-tertiary)]',
                )}
            >
                已读 {readCount}/{groupSize - 1}
            </span>
        )
    }

    switch (status) {
        case 'sending':
            return <IconSending onSelfBubble={onSelfBubble} />
        case 'failed':
            return <IconFailed />
        case 'read':
            return <IconDoubleCheck read onSelfBubble={onSelfBubble} />
        case 'delivered':
            return <IconDoubleCheck onSelfBubble={onSelfBubble} />
        case 'sent':
        default:
            return <IconSingleCheck onSelfBubble={onSelfBubble} />
    }
}

function IconSending({ onSelfBubble }: { onSelfBubble?: boolean }) {
    return (
        <Loader2
            className={cn(
                'w-3 h-3 animate-spin',
                onSelfBubble ? 'text-white/80' : 'text-[#8E8E93]',
            )}
            strokeWidth={2.5}
        />
    )
}

function IconSingleCheck({ onSelfBubble }: { onSelfBubble?: boolean }) {
    return (
        <Check
            className={cn(
                'w-3.5 h-3.5',
                onSelfBubble ? 'text-white/80' : 'text-[#8E8E93]',
            )}
            strokeWidth={3}
        />
    )
}

function IconDoubleCheck({
    read,
    onSelfBubble,
}: {
    read?: boolean
    onSelfBubble?: boolean
}) {
    return (
        <CheckCheck
            className={cn(
                'w-3.5 h-3.5',
                read
                    ? onSelfBubble
                        ? 'text-white'
                        : 'text-[var(--accent)]'
                    : onSelfBubble
                        ? 'text-white/80'
                        : 'text-[var(--text-tertiary)]',
            )}
            strokeWidth={3}
        />
    )
}

function IconFailed() {
    return <AlertCircle className="w-3.5 h-3.5 text-[var(--danger)]" strokeWidth={2.5} />
}
