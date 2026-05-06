import { Bot, QrCode, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PopMenu } from '../../components/common/PopMenu'
import { ConversationItem } from '../../components/conversation/ConversationItem'
import { ConversationMenu, type ConversationMenuAction } from '../../components/conversation/ConversationMenu'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { useConversations } from '../../hooks/useConversations'
import { chatService } from '../../services'
import type { Conversation } from '../../types'

export function ConversationListPage() {
    const { conversations, loading, error, refresh } = useConversations()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const [actionConv, setActionConv] = useState<Conversation | null>(null)
    const [actionRect, setActionRect] = useState<DOMRect | null>(null)

    const openConversationMenu = (conversation: Conversation, rect: DOMRect) => {
        setActionConv(conversation)
        setActionRect(rect)
    }

    const closeConversationMenu = () => {
        setActionConv(null)
        setActionRect(null)
    }

    const handleConversationAction = async (action: ConversationMenuAction) => {
        if (!actionConv) return
        try {
            if (action === 'toggle-pin') {
                await chatService.setPinned(actionConv.id, !actionConv.pinned)
            } else if (action === 'toggle-mute') {
                await chatService.setMute(actionConv.id, !actionConv.muteNotice)
            } else if (action === 'delete') {
                await chatService.deleteConversation(actionConv.id)
            }
            await refresh()
        } catch {
            // best effort
        }
        closeConversationMenu()
    }

    return (
        <div className="relative h-full">
            <Page
                header={
                    <PageHeader
                        title="信息"
                        onAdd={() => setMenuOpen((v) => !v)}
                        onSearch={() => navigate('/search')}
                    />
                }
            >
                {loading ? (
                    <div className="p-6 text-center text-[var(--text-tertiary)] text-sm">加载中…</div>
                ) : error ? (
                    <div className="p-6 text-center text-[#FF453A] text-sm">
                        加载失败：{error.message}
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="p-10 text-center text-[var(--text-tertiary)] text-sm">暂无消息</div>
                ) : (
                    <div>
                        {conversations.map((c) => (
                            <ConversationItem
                                key={c.id}
                                conversation={c}
                                onOpenMenu={openConversationMenu}
                            />
                        ))}
                    </div>
                )}
            </Page>
            <PopMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                items={[
                    {
                        key: 'group',
                        label: '发起群聊',
                        icon: <Users className="w-4 h-4" />,
                        onClick: () => navigate('/new-group'),
                    },
                    {
                        key: 'bots',
                        label: '添加机器人',
                        icon: <Bot className="w-4 h-4" />,
                        onClick: () => navigate('/bots'),
                    },
                    {
                        key: 'friend',
                        label: '添加朋友',
                        icon: <UserPlus className="w-4 h-4" />,
                        onClick: () => console.info('add friend'),
                    },
                    {
                        key: 'scan',
                        label: '扫一扫',
                        icon: <QrCode className="w-4 h-4" />,
                        onClick: () => console.info('scan'),
                    },
                ]}
            />
            <ConversationMenu
                open={Boolean(actionConv && actionRect)}
                anchorRect={actionRect}
                pinned={Boolean(actionConv?.pinned)}
                muted={Boolean(actionConv?.muteNotice)}
                onAction={handleConversationAction}
                onClose={closeConversationMenu}
            />
        </div>
    )
}
