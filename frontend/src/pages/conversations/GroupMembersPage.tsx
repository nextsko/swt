import { ArrowLeft, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../../components/common/Avatar'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { useBots } from '../../hooks/useBots'
import { useContacts } from '../../hooks/useContacts'
import { chatService, profileService } from '../../services'
import type { Bot, Conversation, User } from '../../types'

interface Member {
    id: string
    name: string
    avatar: string
    isBot: boolean
    isOwner: boolean
    isSelf: boolean
}

/**
 * GroupMembersPage：群聊成员管理
 * - 网格显示全部成员；owner 头像有徽章
 * - 进入"移除模式"后，成员右上角显示 Minus 图标，点击移除
 * - 两个 + / − 操作按钮（空位：添加成员）
 */
export function GroupMembersPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { contacts } = useContacts()
    const { bots } = useBots()
    const [conv, setConv] = useState<Conversation | null>(null)
    const [self, setSelf] = useState<User | null>(null)
    const [removing, setRemoving] = useState(false)

    useEffect(() => {
        if (!id) return
        let cancel = false
            ; (async () => {
                const [c, u] = await Promise.all([
                    chatService.getConversation(id),
                    profileService.getCurrentUser(),
                ])
                if (cancel) return
                setConv(c)
                setSelf(u)
            })()
        return () => {
            cancel = true
        }
    }, [id])

    const members: Member[] = useMemo(() => {
        if (!conv || !self) return []
        const ids = conv.memberIds ?? []
        const ownerId = conv.ownerId ?? self.id
        return ids.map((uid) => {
            if (uid === self.id) {
                return {
                    id: uid,
                    name: self.name,
                    avatar: self.avatarUrl,
                    isBot: false,
                    isOwner: ownerId === uid,
                    isSelf: true,
                }
            }
            if (uid.startsWith('bot_')) {
                const b = bots.find((x: Bot) => x.id === uid)
                return {
                    id: uid,
                    name: b?.name ?? uid,
                    avatar: b?.avatar ?? '',
                    isBot: true,
                    isOwner: ownerId === uid,
                    isSelf: false,
                }
            }
            const c = contacts.find((x) => x.id === uid)
            return {
                id: uid,
                name: c?.name ?? uid,
                avatar: c?.avatarUrl ?? '',
                isBot: false,
                isOwner: ownerId === uid,
                isSelf: false,
            }
        })
    }, [conv, self, contacts, bots])

    const removeMember = async (memberId: string) => {
        if (!conv) return
        const newMembers = (conv.memberIds ?? []).filter((m) => m !== memberId)
        // 使用 createGroup 反向接入成本太大，简化：走 MockStore 内 CreateGroup 方案暂不支持更新
        // 阶段 C：后端支持 UpdateGroupMembers；当前阶段仅前端本地乐观更新
        setConv({ ...conv, memberIds: newMembers })
    }

    const handleAddMember = () => {
        // 简单方案：导航到 /new-group 预填当前成员（阶段 C 再做）
        // 现阶段仅返回会话详情
        navigate(`/chat/${id}`)
    }

    if (!conv) {
        return (
            <Page
                header={
                    <PageHeader
                        title="群成员"
                        left={
                            <button className="text-[var(--header-text)] -ml-1 mr-1" onClick={() => navigate(-1)}>
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                        }
                        right={<div className="w-6" />}
                    />
                }
            >
                <div className="p-10 text-center text-[var(--text-tertiary)] text-sm">加载中…</div>
            </Page>
        )
    }

    const isGroup = conv.type === 'group'
    const iAmOwner = conv.ownerId === self?.id

    return (
        <Page
            header={
                <PageHeader
                    title={
                        <span className="text-[22px] font-semibold">
                            群成员 ({members.length})
                        </span>
                    }
                    left={
                        <button
                            className="text-[var(--header-text)] -ml-1 mr-1"
                            onClick={() => navigate(-1)}
                            aria-label="back"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    }
                    right={
                        iAmOwner ? (
                            <button
                                className="px-3 h-7 rounded-full bg-white/20 text-white text-[13px]"
                                onClick={() => setRemoving((v) => !v)}
                            >
                                {removing ? '完成' : '管理'}
                            </button>
                        ) : (
                            <div className="w-6" />
                        )
                    }
                />
            }
            contentClassName="py-4"
        >
            <div className="grid grid-cols-5 gap-y-5 gap-x-2 px-4">
                {members.map((m) => (
                    <div key={m.id} className="flex flex-col items-center gap-1.5 relative">
                        <div className="relative">
                            <Avatar src={m.avatar} name={m.name} size={52} />
                            {m.isOwner && (
                                <span className="absolute -top-1 -right-1 bg-[#FFCC00] text-[9px] text-[var(--text-secondary)] px-1 rounded-sm font-semibold">
                                    群主
                                </span>
                            )}
                            {m.isBot && (
                                <span className="absolute -bottom-1 -right-1 bg-[var(--accent)] text-white text-[9px] px-1 rounded-sm font-medium">
                                    AI
                                </span>
                            )}
                            {removing && !m.isOwner && !m.isSelf && (
                                <button
                                    className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[var(--danger)] text-white flex items-center justify-center shadow"
                                    onClick={() => removeMember(m.id)}
                                    aria-label="remove"
                                >
                                    <Minus className="w-3 h-3" strokeWidth={3} />
                                </button>
                            )}
                        </div>
                        <span className="text-[12px] text-[var(--text-primary)] truncate max-w-[58px]">
                            {m.isSelf ? `${m.name}（我）` : m.name}
                        </span>
                    </div>
                ))}
                {/* 添加成员 */}
                {!removing && iAmOwner && isGroup && (
                    <button
                        className="flex flex-col items-center gap-1.5"
                        onClick={handleAddMember}
                    >
                        <div className="w-[52px] h-[52px] rounded-full border-2 border-dashed border-[var(--text-quaternary)] flex items-center justify-center">
                            <Plus className="w-6 h-6 text-[var(--text-tertiary)]" />
                        </div>
                        <span className="text-[12px] text-[var(--text-tertiary)]">添加</span>
                    </button>
                )}
            </div>
        </Page>
    )
}
