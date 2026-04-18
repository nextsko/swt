import { BellOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatConversationTime } from '../../lib/time'
import type { Conversation } from '../../types'
import { Avatar, GroupAvatar } from '../common/Avatar'
import { Badge } from '../common/Badge'

/**
 * 会话列表项
 * - group 使用九宫格头像
 * - bot 显示「机器人」标签
 * - 草稿优先替换 lastMessage
 */
export function ConversationItem({ conversation }: { conversation: Conversation }) {
    const navigate = useNavigate()

    const renderAvatar = () => {
        if (conversation.type === 'group' && conversation.memberAvatars?.length) {
            return <GroupAvatar avatars={conversation.memberAvatars} size={44} />
        }
        return <Avatar src={conversation.avatarUrl} name={conversation.title} size={44} />
    }

    const hasDraft = Boolean(conversation.draft && conversation.draft.trim())

    return (
        <div
            className="flex items-center gap-3 pl-4 bg-white active:bg-[#F2F2F7] cursor-pointer"
            onClick={() => navigate(`/chat/${conversation.id}`)}
        >
            <div className="relative flex-none py-3">
                {renderAvatar()}
                {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1">
                        <Badge count={conversation.unreadCount} />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-3 py-3 pr-4 border-b border-[#E5E5EA]">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[16px] text-[#08060d] font-medium leading-tight truncate">
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
                                <span className="text-[#FF3B30] mr-1">[草稿]</span>
                                <span className="text-[#8E8E93]">{conversation.draft}</span>
                            </>
                        ) : (
                            <span className="text-[#8E8E93]">{conversation.lastMessage}</span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-none">
                    <span className="text-[11px] text-[#8E8E93] leading-none">
                        {formatConversationTime(conversation.lastTime)}
                    </span>
                    {conversation.muteNotice && <BellOff className="w-3.5 h-3.5 text-[#C7C7CC]" />}
                </div>
            </div>
        </div>
    )
}
