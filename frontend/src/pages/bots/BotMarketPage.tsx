import { ArrowLeft, Check, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../../components/common/Avatar'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { useBots } from '../../hooks/useBots'
import { cn } from '../../lib/cn'
import type { Bot } from '../../types'

/**
 * 机器人市场：展示全部 persona 卡片。
 * - 未安装：显示 "+" 按钮 → install
 * - 已安装：显示 "已添加" 勾 → 点击进入单聊
 */
export function BotMarketPage() {
    const navigate = useNavigate()
    const { bots, loading, install } = useBots()
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
        navigate(`/chat/c_bot_${bot.id}`)
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
                <div className="p-6 text-center text-[#8E8E93] text-sm">加载中…</div>
            ) : (
                <div className="px-4 pt-4 grid grid-cols-1 gap-3">
                    {bots.map((bot) => (
                        <div
                            key={bot.id}
                            className="bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3"
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
                                    <span className="text-[16px] font-semibold text-[#08060d]">
                                        {bot.name}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                                        MiniMax 派生
                                    </span>
                                </div>
                                <div className="text-[13px] text-[#3C3C43] mt-1 leading-snug">
                                    {bot.persona}
                                </div>
                                <div className="text-[11px] text-[#8E8E93] mt-1">
                                    温度 {bot.temperature} · 最多 {bot.maxTokens} tokens
                                </div>
                            </div>
                            <button
                                className={cn(
                                    'shrink-0 px-3 h-8 rounded-full flex items-center gap-1 text-[13px] font-medium',
                                    bot.installed
                                        ? 'bg-[#E5E5EA] text-[#3C3C43]'
                                        : 'bg-[#2196F3] text-white',
                                )}
                                onClick={() => (bot.installed ? onOpenChat(bot) : onInstall(bot))}
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
