import { ArrowLeft, MessageSquare, Phone, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../../components/common/Avatar'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { chatService, contactService } from '../../services'
import type { Contact, Conversation } from '../../types'

export function ContactDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [contact, setContact] = useState<Contact | null>(null)
    const [conversation, setConversation] = useState<Conversation | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        ;(async () => {
            const [c, conversations] = await Promise.all([
                contactService.getContact(id),
                chatService.getConversations(),
            ])
            setContact(c)
            const matched = conversations.find(
                (item) =>
                    (item.type === 'single' && item.title === contact?.name) ||
                    (item.type === 'single' && item.memberIds?.includes(id ?? '')),
            )
            setConversation(matched ?? null)
            setLoading(false)
        })()
    }, [id])

    if (loading) {
        return (
            <Page
                header={
                    <PageHeader
                        title="联系人详情"
                        left={
                            <button
                                className="text-[var(--header-text)] -ml-1 mr-1"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                        }
                    />
                }
            >
                <div className="p-10 text-center text-[var(--text-tertiary)] text-sm">加载中…</div>
            </Page>
        )
    }

    if (!contact) {
        return (
            <Page
                header={
                    <PageHeader
                        title="联系人详情"
                        left={
                            <button
                                className="text-[var(--header-text)] -ml-1 mr-1"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                        }
                    />
                }
            >
                <div className="p-10 text-center text-[var(--text-tertiary)] text-sm">未找到</div>
            </Page>
        )
    }

    return (
        <Page
            header={
                <PageHeader
                    title={<span className="text-[22px] font-semibold">联系人详情</span>}
                    left={
                        <button
                            className="text-[var(--header-text)] -ml-1 mr-1"
                            onClick={() => navigate(-1)}
                            aria-label="back"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    }
                    right={<div className="w-6" />}
                />
            }
            contentClassName="pb-8"
        >
            {/* Profile Card */}
            <div className="px-4 pt-4">
                <div className="glass-panel rounded-2xl shadow-md p-5 flex items-center gap-4 ring-1 ring-black/5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-none overflow-hidden">
                        <Avatar src={contact.avatarUrl} name={contact.name} size={64} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[18px] font-semibold text-[var(--text-primary)]">
                            {contact.name}
                        </div>
                        {contact.wildFireId && (
                            <div className="text-[13px] text-[var(--text-secondary)] mt-1">
                                WildFire ID: {contact.wildFireId}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="px-4 mt-3 flex gap-2">
                <button
                    className={conversation
                        ? 'flex-1 h-10 rounded-xl bg-[var(--accent)] text-white text-[14px] font-medium flex items-center justify-center gap-1.5 active:opacity-80'
                        : 'flex-1 h-10 rounded-xl bg-[var(--bg-input)] text-[var(--text-tertiary)] text-[14px] font-medium flex items-center justify-center gap-1.5'}
                    onClick={() => conversation && navigate(`/chat/${conversation.id}`)}
                    disabled={!conversation}
                >
                    <MessageSquare className="w-4 h-4" />
                    {conversation ? '发消息' : '暂无会话'}
                </button>
                <button className="w-10 h-10 rounded-xl glass-panel text-[var(--text-secondary)] flex items-center justify-center active:opacity-80 shadow-sm ring-1 ring-black/5">
                    <Phone className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-xl glass-panel text-[var(--text-secondary)] flex items-center justify-center active:opacity-80 shadow-sm ring-1 ring-black/5">
                    <Video className="w-5 h-5" />
                </button>
            </div>

            {/* Info section */}
            <div className="px-4 mt-5">
                <div className="glass-panel rounded-2xl shadow-md overflow-hidden ring-1 ring-black/5">
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                        <span className="text-[15px] font-semibold text-[var(--text-primary)]">
                            基本信息
                        </span>
                    </div>
                    <div className="px-4 py-3 flex justify-between border-b border-[var(--border)]">
                        <span className="text-[14px] text-[var(--text-secondary)]">ID</span>
                        <span className="text-[14px] text-[var(--text-primary)]">{contact.id}</span>
                    </div>
                    <div className="px-4 py-3 flex justify-between">
                        <span className="text-[14px] text-[var(--text-secondary)]">昵称</span>
                        <span className="text-[14px] text-[var(--text-primary)]">{contact.name}</span>
                    </div>
                </div>
            </div>
        </Page>
    )
}
