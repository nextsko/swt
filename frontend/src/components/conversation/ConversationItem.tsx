import { BellOff } from 'lucide-react'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatConversationTime } from '../../lib/time'
import type { Conversation } from '../../types'
import { Avatar, GroupAvatar } from '../common/Avatar'
import { Badge } from '../common/Badge'
import { useLongPress } from './BubbleMenu'

/**
 * 会话列表项
 * - group 使用九宫格头像
 * - bot 显示「机器人」标签
 * - 草稿优先替换 lastMessage
 */
export function ConversationItem({
    conversation,
    onOpenMenu,
}: {
    conversation: Conversation
    onOpenMenu?: (conversation: Conversation, rect: DOMRect) => void
}) {
    const navigate = useNavigate()
    const suppressClickRef = useRef(false)
    const longPressBinders = useLongPress((rect) => {
        suppressClickRef.current = true
        if (onOpenMenu) onOpenMenu(conversation, rect)
        window.setTimeout(() => {
            suppressClickRef.current = false
        }, 250)
    })

    const renderAvatar = () => {
        if (conversation.type === 'group' && conversation.memberAvatars?.length) {
            return <GroupAvatar avatars={conversation.memberAvatars} size={44} />
        }
        return <Avatar src={conversation.avatarUrl} name={conversation.title} size={44} />
    }

    const hasDraft = Boolean(conversation.draft && conversation.draft.trim())

    return (
        <div
            className="flex items-center gap-3 pl-4 bg-[var(--bg-secondary)] active:bg-[var(--bg-input)] cursor-pointer"
            onClick={() => {
                if (suppressClickRef.current) return
                navigate(`/chat/${conversation.id}`)
            }}
            {...longPressBinders}
        >
            <div className="relative flex-none py-3">
                {renderAvatar()}
                {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1">
                        <Badge count={conversation.unreadCount} />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-3 py-3 pr-4 border-b border-[var(--border)]">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[16px] text-[var(--text-primary)] font-medium leading-tight truncate">
                            {conversation.title}
                        </span>
                        {conversation.type === 'bot' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 flex-none">
                                AI
                            </span>
                        )}
                    </div>
                    <div className="text-[13px] mt-1.5 leading-tight truncate">
                        {hasDraft ? (
                            <>
                                <span className="text-[var(--danger)] mr-1">[草稿]</span>
                                <span className="text-[var(--text-tertiary)]">{conversation.draft}</span>
                            </>
                        ) : (
                            <span className="text-[var(--text-tertiary)]">{conversation.lastMessage}</span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-none">
                    <span className="text-[11px] text-[var(--text-tertiary)] leading-none">
                        {formatConversationTime(conversation.lastTime)}
                    </span>
                    {conversation.muteNotice && <BellOff className="w-3.5 h-3.5 text-[var(--text-quaternary)]" />}
                </div>
            </div>
        </div>
    )
}
