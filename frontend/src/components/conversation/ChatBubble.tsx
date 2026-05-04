import { FileText, MapPin, Mic, Phone, Play, Wallet } from 'lucide-react'
import { cn } from '../../lib/cn'
import { formatMessageTime } from '../../lib/time'
import type { Message } from '../../types'
import { Avatar } from '../common/Avatar'
import { useLongPress } from './BubbleMenu'
import { MarkdownText } from './MarkdownText'
import { MessageStatusTick } from './MessageStatusTick'

/**
 * 聊天气泡：根据 IsSelf 控制左右对齐；根据类型切换渲染
 * Text 类型消息通过 <MarkdownText> 渲染 Markdown。
 * 自己消息右下角展示状态 tick；群聊时展示"已读 N/M"。
 *
 * 长按气泡触发 onLongPress(message, rect)，父组件可弹出 BubbleMenu。
 */
export function ChatBubble({
    message,
    groupSize,
    onLongPress,
}: {
    message: Message
    /** 若当前会话是群聊，传入群成员人数 */
    groupSize?: number
    onLongPress?: (message: Message, rect: DOMRect) => void
}) {
    // system tip 不支持长按
    const longPressBinders = useLongPress((rect) => {
        if (onLongPress) onLongPress(message, rect)
    })

    if (message.type === 'tip') {
        return (
            <div className="flex justify-center my-2">
                <span className="text-[12px] text-[var(--text-tertiary)] bg-[var(--bubble-tip-bg)] px-3 py-1 rounded">
                    {message.text}
                </span>
            </div>
        )
    }

    const isSelf = message.isSelf
    const bubbleBase = 'w-fit max-w-full rounded-2xl px-3 py-2 leading-relaxed text-[15px] select-text'
    const bubbleSide = isSelf
        ? 'bg-[var(--bubble-self)] text-[var(--bubble-self-text)] rounded-tr-sm'
        : 'bg-[var(--bubble-other)] text-[var(--bubble-other-text)] rounded-tl-sm shadow-sm'

    return (
        <div
            className={cn('flex gap-2 px-3 my-1.5 items-end', isSelf && 'flex-row-reverse')}
        >
            <Avatar src={message.senderAvatar} name={message.senderName} size={36} />
            <div className={cn('flex flex-col max-w-[78%] gap-0.5', isSelf && 'items-end')}>
                {!isSelf && !!groupSize && groupSize > 2 && (
                    <div className="text-[11px] text-[var(--text-tertiary)] mb-0.5 px-1">
                        {message.senderName}
                    </div>
                )}
                <div {...longPressBinders} className="select-none touch-manipulation">
                    {renderContent(message, bubbleBase, bubbleSide)}
                </div>
                {isSelf && (
                    <div className="flex items-center gap-1 px-1">
                        <MessageStatusTick
                            message={message}
                            groupSize={groupSize}
                            onSelfBubble={false}
                        />
                        <span className="text-[10px] text-[var(--text-quaternary)]">
                            {formatMessageTime(message.timestamp)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

function renderContent(message: Message, base: string, side: string) {
    switch (message.type) {
        case 'text':
            return (
                <div className={cn(base, side)}>
                    <MarkdownText text={message.text ?? ''} isSelf={message.isSelf} />
                </div>
            )
        case 'image':
            return (
                <img
                    src={message.mediaUrl}
                    alt="img"
                    className="rounded-xl max-w-[200px] max-h-[260px] object-cover border border-white/40 shadow-sm"
                    draggable={false}
                />
            )
        case 'video':
            return (
                <div className="relative">
                    <img
                        src={message.mediaUrl}
                        alt="video"
                        className="rounded-xl max-w-[200px] max-h-[260px] object-cover border border-white/40 shadow-sm"
                        draggable={false}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-black/45 flex items-center justify-center">
                            <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                    </div>
                    {message.durationSec ? (
                        <div className="absolute bottom-1 right-2 text-white text-[12px] font-medium drop-shadow">
                            {message.durationSec}s
                        </div>
                    ) : null}
                </div>
            )
        case 'voice':
            return (
                <div className={cn(base, side, 'flex items-center gap-3 min-w-[110px]')}>
                    <Mic className="w-4 h-4" strokeWidth={2.5} />
                    <span>{message.durationSec ?? 1}″</span>
                </div>
            )
        case 'call':
            return (
                <div
                    className={cn(base, side, 'flex items-center gap-2 text-[13px]', message.isSelf ? 'text-[var(--bubble-self-text)]' : 'text-[var(--bubble-other-text)]')}
                >
                    <Phone className="w-4 h-4" strokeWidth={2.5} />
                    <span>{message.text || '[音视频通话]'}</span>
                </div>
            )
        case 'file':
            return (
                <div className={cn(base, side, 'flex items-center gap-2 min-w-[180px]')}>
                    <FileText className="w-6 h-6 shrink-0" strokeWidth={1.8} />
                    <div className="min-w-0">
                        <div className="text-[14px] truncate">{message.fileName || '未命名文件'}</div>
                        <div className={cn('text-[11px]', message.isSelf ? 'text-white/70' : 'text-[var(--text-tertiary)]')}>
                            文件
                        </div>
                    </div>
                </div>
            )
        case 'location':
            return (
                <div className={cn(base, side, 'flex flex-col gap-1 min-w-[200px]')}>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" strokeWidth={2.2} />
                        <span className="text-[14px]">{message.text || '位置'}</span>
                    </div>
                    <div className={cn('text-[11px]', message.isSelf ? 'text-white/70' : 'text-[var(--text-tertiary)]')}>
                        [共享位置]
                    </div>
                </div>
            )
        case 'redpacket':
            return (
                <div
                    className={cn(
                        'w-fit rounded-2xl px-4 py-3 text-white flex items-center gap-3 min-w-[180px]',
                        'bg-gradient-to-br from-[#FF6B35] to-[#FF3B30] shadow',
                    )}
                >
                    <Wallet className="w-8 h-8" strokeWidth={1.8} />
                    <div>
                        <div className="text-[15px] font-semibold">{message.text || '红包'}</div>
                        <div className="text-[11px] text-white/80">恭喜发财</div>
                    </div>
                </div>
            )
        default:
            return <div className={cn(base, side)}>{message.text}</div>
    }
}
