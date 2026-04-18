import { Bot, QrCode, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PopMenu } from '../../components/common/PopMenu'
import { ConversationItem } from '../../components/conversation/ConversationItem'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { useConversations } from '../../hooks/useConversations'

export function ConversationListPage() {
    const { conversations, loading } = useConversations()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)

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
                    <div className="p-6 text-center text-[#8E8E93] text-sm">加载中…</div>
                ) : conversations.length === 0 ? (
                    <div className="p-10 text-center text-[#8E8E93] text-sm">暂无消息</div>
                ) : (
                    <div>
                        {conversations.map((c) => (
                            <ConversationItem key={c.id} conversation={c} />
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
        </div>
    )
}
