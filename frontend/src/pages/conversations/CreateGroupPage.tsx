import { ArrowLeft, Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../../components/common/Avatar'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { useBots } from '../../hooks/useBots'
import { useContacts } from '../../hooks/useContacts'
import { cn } from '../../lib/cn'
import { chatService } from '../../services'

/**
 * 创建群聊：
 * - 左侧勾选联系人（多选）
 * - 底部抽屉展示已选；底部发起按钮提交
 * - 可选：在已选中 chip 最右侧点击 "+" 机器人 → 拉起机器人选择
 */
export function CreateGroupPage() {
    const navigate = useNavigate()
    const { contacts } = useContacts()
    const { installed: installedBots } = useBots()
    const [picked, setPicked] = useState<Set<string>>(new Set())
    const [title, setTitle] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const toggle = (id: string) => {
        setPicked((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const pickedList = useMemo(() => {
        const map = new Map<string, { id: string; name: string; avatar: string; isBot: boolean }>()
        contacts.forEach((c) => {
            if (picked.has(c.id))
                map.set(c.id, { id: c.id, name: c.name, avatar: c.avatarUrl, isBot: false })
        })
        installedBots.forEach((b) => {
            if (picked.has(b.id))
                map.set(b.id, { id: b.id, name: b.name, avatar: b.avatar, isBot: true })
        })
        return Array.from(map.values())
    }, [picked, contacts, installedBots])

    const onSubmit = async () => {
        if (pickedList.length === 0) return
        setSubmitting(true)
        try {
            const conv = await chatService.createGroup(title, pickedList.map((m) => m.id))
            if (conv) navigate(`/chat/${conv.id}`, { replace: true })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Page
            header={
                <PageHeader
                    title={<span className="text-[22px] font-semibold">发起群聊</span>}
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
                        <button
                            className={cn(
                                'px-3 h-7 rounded-full text-[13px] font-medium transition-colors',
                                pickedList.length > 0
                                    ? 'bg-white text-[var(--accent)]'
                                    : 'bg-white/25 text-white/60',
                            )}
                            disabled={pickedList.length === 0 || submitting}
                            onClick={onSubmit}
                        >
                            创建 ({pickedList.length})
                        </button>
                    }
                />
            }
            contentClassName="pb-28"
        >
            <div className="px-4 py-3 glass-panel border-b border-[var(--border)]">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="群聊名称（可选）"
                    className="w-full h-9 bg-[var(--bg-input)] rounded-xl px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-shadow"
                />
            </div>

            {/* 机器人分组 */}
            {installedBots.length > 0 && (
                <SelectGroup title="机器人">
                    {installedBots.map((b) => (
                        <SelectRow
                            key={b.id}
                            id={b.id}
                            name={b.name}
                            avatar={b.avatar}
                            checked={picked.has(b.id)}
                            onToggle={toggle}
                            tag="机器人"
                        />
                    ))}
                </SelectGroup>
            )}

            {/* 联系人分组 */}
            <SelectGroup title="联系人">
                {contacts.map((c) => (
                    <SelectRow
                        key={c.id}
                        id={c.id}
                        name={c.name}
                        avatar={c.avatarUrl}
                        checked={picked.has(c.id)}
                        onToggle={toggle}
                    />
                ))}
            </SelectGroup>

            {pickedList.length > 0 && (
                <div
                    className="fixed bottom-0 left-0 right-0 glass-panel border-t border-[var(--border)] px-3 py-2 flex items-center gap-2 overflow-x-auto"
                    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)', backdropFilter: 'blur(22px) saturate(1.4)', WebkitBackdropFilter: 'blur(22px) saturate(1.4)' }}
                >
                    {pickedList.map((m) => (
                        <div
                            key={m.id}
                            className="flex-none flex items-center gap-1 pr-1 pl-0.5 rounded-full bg-[var(--bg-input)]"
                        >
                            <Avatar src={m.avatar} name={m.name} size={24} />
                            <span className="text-[12px]">{m.name}</span>
                            <button
                                className="w-5 h-5 flex items-center justify-center text-[var(--text-tertiary)] text-[14px]"
                                onClick={() => toggle(m.id)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </Page>
    )
}

function SelectGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="px-4 pt-4 pb-1 text-[12px] text-[var(--text-tertiary)]">{title}</div>
            <div className="glass-panel rounded-2xl overflow-hidden ring-1 ring-black/5">{children}</div>
        </div>
    )
}

function SelectRow({
    id,
    name,
    avatar,
    checked,
    onToggle,
    tag,
}: {
    id: string
    name: string
    avatar: string
    checked: boolean
    onToggle: (id: string) => void
    tag?: string
}) {
    return (
        <button
            className="w-full flex items-center gap-3 px-4 py-2 active:bg-[var(--bg-input)]"
            onClick={() => onToggle(id)}
        >
            <div
                className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-none',
                    checked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--text-quaternary)]',
                )}
            >
                {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </div>
            <Avatar src={avatar} name={name} size={36} />
            <span className="flex-1 text-left text-[15px] truncate">{name}</span>
            {tag && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-medium flex-none">
                    {tag}
                </span>
            )}
        </button>
    )
}
