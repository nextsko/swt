import { ArrowLeft, Check, MessageSquare, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../../components/common/Avatar'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { getBotConversationId } from '../../lib/botConversation'
import { cn } from '../../lib/cn'
import { botService } from '../../services'
import type { Bot } from '../../types'

const AVAILABLE_TOOLS = [
    { id: 'file', label: '文件', desc: '读写本地文件' },
    { id: 'bash', label: '终端', desc: '执行 Shell 命令' },
    { id: 'fetch-mcp', label: '搜索', desc: '网络搜索/抓取' },
] as const

export function BotDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [bot, setBot] = useState<Bot | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTools, setActiveTools] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!id) return
        ;(async () => {
            const b = await botService.getBot(id)
            if (b) {
                setBot(b)
                setActiveTools(
                    b.toolIds && b.toolIds.length > 0
                        ? new Set(b.toolIds)
                        : new Set(AVAILABLE_TOOLS.map((t) => t.id)),
                )
            }
            setLoading(false)
        })()
    }, [id])

    const toggleTool = (toolId: string) => {
        setActiveTools((prev) => {
            const next = new Set(prev)
            if (next.has(toolId)) {
                if (next.size > 1) next.delete(toolId)
            } else {
                next.add(toolId)
            }
            return next
        })
    }

    const saveTools = async () => {
        if (!bot) return
        setSaving(true)
        try {
            const ids = Array.from(activeTools)
            await botService.setToolIds(
                bot.id,
                ids.length === AVAILABLE_TOOLS.length ? [] : ids,
            )
            setBot({ ...bot, toolIds: ids.length === AVAILABLE_TOOLS.length ? undefined : ids })
        } finally {
            setSaving(false)
        }
    }

    const openChat = () => {
        if (bot) navigate(`/chat/${getBotConversationId(bot.id)}`)
    }

    if (loading) {
        return (
            <Page
                header={
                    <PageHeader
                        title="机器人详情"
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

    if (!bot) {
        return (
            <Page
                header={
                    <PageHeader
                        title="机器人详情"
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

    const allActive = activeTools.size === AVAILABLE_TOOLS.length

    return (
        <Page
            header={
                <PageHeader
                    title={<span className="text-[22px] font-semibold">机器人详情</span>}
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
            {/* Bot Profile Card */}
            <div className="px-4 pt-4">
                <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm p-5 flex items-center gap-4">
                    <div
                        className={cn(
                            'w-16 h-16 rounded-2xl flex items-center justify-center flex-none overflow-hidden',
                            bot.accentColor || 'bg-blue-500',
                        )}
                    >
                        <Avatar src={bot.avatar} name={bot.name} size={64} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[18px] font-semibold text-[var(--text-primary)]">
                            {bot.name}
                        </div>
                        <div className="text-[13px] text-[var(--text-secondary)] mt-1 leading-snug">
                            {bot.persona}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="px-4 mt-3 flex gap-2">
                {bot.installed && (
                    <button
                        className="flex-1 h-10 rounded-xl bg-[var(--accent)] text-white text-[14px] font-medium flex items-center justify-center gap-1.5 active:opacity-80"
                        onClick={openChat}
                    >
                        <MessageSquare className="w-4 h-4" />
                        开始聊天
                    </button>
                )}
            </div>

            {/* Tool Configuration */}
            <div className="px-4 mt-5">
                <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-[var(--accent)]" />
                        <span className="text-[15px] font-semibold text-[var(--text-primary)]">
                            工具配置
                        </span>
                        {allActive && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-tertiary)]">
                                全部启用
                            </span>
                        )}
                    </div>
                    {AVAILABLE_TOOLS.map((tool) => {
                        const active = activeTools.has(tool.id)
                        return (
                            <button
                                key={tool.id}
                                className="w-full flex items-center gap-3 px-4 py-3 active:bg-[var(--bg-input)] border-b border-[var(--border)] last:border-b-0"
                                onClick={() => toggleTool(tool.id)}
                            >
                                <div
                                    className={cn(
                                        'w-5 h-5 rounded flex items-center justify-center flex-none border',
                                        active
                                            ? 'bg-[var(--accent)] border-[var(--accent)]'
                                            : 'border-[var(--text-quaternary)]',
                                    )}
                                >
                                    {active && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="text-[14px] text-[var(--text-primary)]">{tool.label}</div>
                                    <div className="text-[12px] text-[var(--text-tertiary)]">{tool.desc}</div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Save button */}
            <div className="px-4 mt-4">
                <button
                    className={cn(
                        'w-full h-10 rounded-xl text-[14px] font-medium active:opacity-80',
                        saving
                            ? 'bg-[var(--bg-input)] text-[var(--text-tertiary)]'
                            : 'bg-[var(--accent)] text-white',
                    )}
                    onClick={saveTools}
                    disabled={saving}
                >
                    {saving ? '保存中…' : '保存配置'}
                </button>
            </div>

            {/* Bot params */}
            <div className="px-4 mt-5">
                <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                        <span className="text-[15px] font-semibold text-[var(--text-primary)]">
                            生成参数
                        </span>
                    </div>
                    <div className="px-4 py-3 flex justify-between border-b border-[var(--border)]">
                        <span className="text-[14px] text-[var(--text-secondary)]">温度</span>
                        <span className="text-[14px] text-[var(--text-primary)]">{bot.temperature}</span>
                    </div>
                    <div className="px-4 py-3 flex justify-between border-b border-[var(--border)]">
                        <span className="text-[14px] text-[var(--text-secondary)]">最大 Tokens</span>
                        <span className="text-[14px] text-[var(--text-primary)]">{bot.maxTokens}</span>
                    </div>
                    <div className="px-4 py-3 flex justify-between">
                        <span className="text-[14px] text-[var(--text-secondary)]">引导语</span>
                        <span className="text-[14px] text-[var(--text-primary)] max-w-[200px] truncate">
                            {bot.greeting}
                        </span>
                    </div>
                </div>
            </div>
        </Page>
    )
}
