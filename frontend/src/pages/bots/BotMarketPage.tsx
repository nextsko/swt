import { ArrowLeft, Check, Plus, Wrench } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../../components/common/Avatar'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { useBots } from '../../hooks/useBots'
import { useConversations } from '../../hooks/useConversations'
import { findBotConversationId } from '../../lib/botConversation'
import { cn } from '../../lib/cn'
import type { Bot } from '../../types'

/** 可用工具清单（与后端 agent.go 中 allToolSets 对齐） */
const AVAILABLE_TOOLS = [
    { id: 'file', label: '文件', desc: '读写文件' },
    { id: 'bash', label: '终端', desc: '执行命令' },
    { id: 'fetch-mcp', label: '搜索', desc: '网络搜索' },
] as const

/**
 * 机器人市场：展示全部 persona 卡片。
 * - 未安装：显示 "+" 按钮 → install
 * - 已安装：显示 "已添加" 勾 → 点击进入单聊
 */
export function BotMarketPage() {
    const navigate = useNavigate()
    const { bots, loading, install } = useBots()
    const { conversations } = useConversations()
    const [installing, setInstalling] = useState<string | null>(null)

    const onInstall = async (bot: Bot) => {
        setInstalling(bot.id)
        try {
            const conv = await install(bot.id)
            if (conv) navigate(`/chat/${conv.id}`)
        } finally {
            setInstalling(null)
        }
    }

    const onOpenChat = (bot: Bot) => {
        const convId = findBotConversationId(conversations, bot.id)
        if (convId) navigate(`/chat/${convId}`)
    }

    return (
        <Page
            header={
                <PageHeader
                    title={<span className="text-[22px] font-semibold">机器人市场</span>}
                    left={
                        <button
                            className="text-white -ml-1 mr-1"
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
            {loading ? (
                <div className="p-6 text-center text-[var(--text-tertiary)] text-sm">加载中…</div>
            ) : (
                <div className="px-4 pt-4 grid grid-cols-1 gap-3">
                    {bots.map((bot) => (
                        <div
                            key={bot.id}
                            className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm p-4 flex items-start gap-3 cursor-pointer active:opacity-90"
                            onClick={() => navigate(`/bots/${bot.id}`)}
                        >
                            <div
                                className={cn(
                                    'w-14 h-14 rounded-2xl flex items-center justify-center flex-none overflow-hidden',
                                    bot.accentColor || 'bg-blue-500',
                                )}
                            >
                                <Avatar src={bot.avatar} name={bot.name} size={56} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[16px] font-semibold text-[var(--text-primary)]">
                                        {bot.name}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-semibold">
                                        MiniMax 派生
                                    </span>
                                </div>
                                <div className="text-[13px] text-[var(--text-secondary)] mt-1 leading-snug">
                                    {bot.persona}
                                </div>
                                <div className="text-[11px] text-[var(--text-tertiary)] mt-1">
                                    温度 {bot.temperature} · 最多 {bot.maxTokens} tokens
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    <Wrench className="w-3 h-3 text-[var(--text-tertiary)] mt-0.5" />
                                    {(bot.toolIds && bot.toolIds.length > 0
                                        ? bot.toolIds
                                        : AVAILABLE_TOOLS.map((t) => t.id)
                                    ).map((tid) => {
                                        const info = AVAILABLE_TOOLS.find((t) => t.id === tid)
                                        return (
                                            <span
                                                key={tid}
                                                className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-secondary)]"
                                            >
                                                {info?.label ?? tid}
                                            </span>
                                        )
                                    })}
                                </div>
                            </div>
                            <button
                                className={cn(
                                    'shrink-0 px-3 h-8 rounded-full flex items-center gap-1 text-[13px] font-medium',
                                    bot.installed
                                        ? 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
                                        : 'bg-[var(--accent)] text-white',
                                )}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    void (bot.installed ? onOpenChat(bot) : onInstall(bot))
                                }}
                                disabled={installing === bot.id}
                            >
                                {bot.installed ? (
                                    <>
                                        <Check className="w-4 h-4" strokeWidth={3} />
                                        打开
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" strokeWidth={3} />
                                        拉取
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </Page>
    )
}
