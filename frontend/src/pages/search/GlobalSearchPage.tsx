import { ArrowLeft, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../../components/common/Avatar'
import { Page } from '../../components/layout/Page'
import { cn } from '../../lib/cn'
import { botService, chatService, contactService } from '../../services'
import type { Bot, Contact, Conversation, Message } from '../../types'

type SearchKind = 'all' | 'conversation' | 'contact' | 'bot' | 'message'

interface MessageHit {
    message: Message
    conversationTitle: string
}

/**
 * 全局搜索：会话 / 联系人 / 机器人 / 历史消息。
 * 统一入口，支持按类型 chip 过滤。
 */
export function GlobalSearchPage() {
    const navigate = useNavigate()
    const [q, setQ] = useState('')
    const [kind, setKind] = useState<SearchKind>('all')
    const [convs, setConvs] = useState<Conversation[]>([])
    const [contacts, setContacts] = useState<Contact[]>([])
    const [bots, setBots] = useState<Bot[]>([])
    const [messageHits, setMessageHits] = useState<MessageHit[]>([])

    // 一次性加载候选数据（搜索侧仅前端过滤）
    useEffect(() => {
        let cancel = false
            ; (async () => {
                const [c, p, b] = await Promise.all([
                    chatService.getConversations(),
                    contactService.getContacts(),
                    botService.listBots(),
                ])
                if (cancel) return
                setConvs(c)
                setContacts(p)
                setBots(b)
            })()
        return () => {
            cancel = true
        }
    }, [])

    // 消息全文搜索：仅在用户开始输入后触发（限于非空会话）
    useEffect(() => {
        if (!q.trim()) {
            setMessageHits([])
            return
        }
        let cancel = false
            ; (async () => {
                const all: MessageHit[] = []
                for (const c of convs) {
                    const msgs = await chatService.getMessages(c.id, 80)
                    msgs.forEach((m) => {
                        if (m.text && m.text.toLowerCase().includes(q.toLowerCase())) {
                            all.push({ message: m, conversationTitle: c.title })
                        }
                    })
                }
                if (!cancel) setMessageHits(all.slice(0, 50))
            })()
        return () => {
            cancel = true
        }
    }, [q, convs])

    const filter = (s: string, ...fields: (string | undefined)[]) =>
        fields.some((f) => f?.toLowerCase().includes(s.toLowerCase()))

    const query = q.trim()
    const filtered = useMemo(() => {
        if (!query) {
            return { convs: [], contacts: [], bots: [], messages: [] as MessageHit[] }
        }
        return {
            convs: convs.filter((c) => filter(query, c.title, c.lastMessage)),
            contacts: contacts.filter((c) => filter(query, c.name, c.wildFireId)),
            bots: bots.filter((b) => filter(query, b.name, b.persona)),
            messages: messageHits,
        }
    }, [query, convs, contacts, bots, messageHits])

    const totalCount =
        filtered.convs.length +
        filtered.contacts.length +
        filtered.bots.length +
        filtered.messages.length

    return (
        <Page
            header={
                <div
                    className="flex items-center gap-2 px-3 pb-2 bg-[#2196F3] text-white"
                    style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
                >
                    <button
                        className="text-white p-1 -ml-1"
                        aria-label="back"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex-1 h-9 bg-white/15 rounded-lg flex items-center px-2 gap-2">
                        <Search className="w-4 h-4 text-white/80" />
                        <input
                            autoFocus
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="搜索消息 / 联系人 / 机器人"
                            className="flex-1 bg-transparent text-[14px] text-white placeholder-white/60 focus:outline-none"
                        />
                        {q && (
                            <button className="text-white/70" onClick={() => setQ('')}>
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            }
            contentClassName="bg-[#F2F2F7]"
        >
            {/* 过滤 chip */}
            <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-[#E5E5EA] bg-white">
                {(
                    [
                        { k: 'all', label: '全部' },
                        { k: 'conversation', label: '聊天' },
                        { k: 'contact', label: '联系人' },
                        { k: 'bot', label: '机器人' },
                        { k: 'message', label: '消息' },
                    ] as const
                ).map((tab) => (
                    <button
                        key={tab.k}
                        className={cn(
                            'px-3 h-7 rounded-full text-[12px] flex-none',
                            kind === tab.k
                                ? 'bg-[#2196F3] text-white'
                                : 'bg-[#F2F2F7] text-[#3C3C43]',
                        )}
                        onClick={() => setKind(tab.k)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {!query && (
                <div className="p-10 text-center text-[#8E8E93] text-sm">
                    输入关键字搜索聊天、联系人、机器人或消息
                </div>
            )}

            {query && totalCount === 0 && (
                <div className="p-10 text-center text-[#8E8E93] text-sm">
                    未找到与"{query}"相关的结果
                </div>
            )}

            {query && (kind === 'all' || kind === 'conversation') && filtered.convs.length > 0 && (
                <Section title="聊天">
                    {filtered.convs.map((c) => (
                        <Row
                            key={c.id}
                            avatar={c.avatarUrl}
                            name={c.title}
                            sub={c.lastMessage}
                            onClick={() => navigate(`/chat/${c.id}`)}
                        />
                    ))}
                </Section>
            )}

            {query && (kind === 'all' || kind === 'bot') && filtered.bots.length > 0 && (
                <Section title="机器人">
                    {filtered.bots.map((b) => (
                        <Row
                            key={b.id}
                            avatar={b.avatar}
                            name={b.name}
                            sub={b.persona}
                            tag={b.installed ? '已添加' : undefined}
                            onClick={() =>
                                b.installed ? navigate(`/chat/c_bot_${b.id}`.replace('c_bot_bot_', 'c_bot_')) : navigate('/bots')
                            }
                        />
                    ))}
                </Section>
            )}

            {query && (kind === 'all' || kind === 'contact') && filtered.contacts.length > 0 && (
                <Section title="联系人">
                    {filtered.contacts.map((c) => (
                        <Row key={c.id} avatar={c.avatarUrl} name={c.name} sub={c.wildFireId} />
                    ))}
                </Section>
            )}

            {query && (kind === 'all' || kind === 'message') && filtered.messages.length > 0 && (
                <Section title="消息">
                    {filtered.messages.map((h) => (
                        <Row
                            key={h.message.id}
                            avatar={h.message.senderAvatar}
                            name={`${h.message.senderName} · ${h.conversationTitle}`}
                            sub={h.message.text}
                            highlight={query}
                            onClick={() => navigate(`/chat/${h.message.conversationId}`)}
                        />
                    ))}
                </Section>
            )}
        </Page>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-3">
            <div className="px-4 pt-3 pb-1 text-[12px] text-[#8E8E93]">{title}</div>
            <div className="bg-white">{children}</div>
        </div>
    )
}

function Row({
    avatar,
    name,
    sub,
    tag,
    highlight,
    onClick,
}: {
    avatar: string
    name: string
    sub?: string
    tag?: string
    highlight?: string
    onClick?: () => void
}) {
    const renderSub = () => {
        if (!sub) return null
        if (!highlight) return sub
        const i = sub.toLowerCase().indexOf(highlight.toLowerCase())
        if (i < 0) return sub
        return (
            <>
                {sub.slice(0, i)}
                <span className="text-[#2196F3] font-medium">
                    {sub.slice(i, i + highlight.length)}
                </span>
                {sub.slice(i + highlight.length)}
            </>
        )
    }

    return (
        <div
            className="flex items-center gap-3 pl-4 bg-white active:bg-[#F2F2F7] cursor-pointer"
            onClick={onClick}
        >
            <Avatar src={avatar} name={name} size={36} />
            <div className="flex-1 min-w-0 flex items-center gap-3 py-2.5 pr-4 border-b border-[#E5E5EA]">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[15px] text-[#08060d] font-medium truncate">
                            {name}
                        </span>
                        {tag && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 flex-none">
                                {tag}
                            </span>
                        )}
                    </div>
                    {sub && (
                        <div className="text-[12px] text-[#8E8E93] truncate mt-0.5">
                            {renderSub()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
