import { ArrowLeft, MoreHorizontal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { BubbleAction } from '../../components/conversation/BubbleMenu'
import { BubbleMenu } from '../../components/conversation/BubbleMenu'
import { ChatBubble } from '../../components/conversation/ChatBubble'
import { ChatComposer } from '../../components/conversation/ChatComposer'
import {
    buildMentionables,
    type Mentionable,
} from '../../components/conversation/MentionPanel'
import { TypingIndicator } from '../../components/conversation/TypingIndicator'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { useBots } from '../../hooks/useBots'
import { useContacts } from '../../hooks/useContacts'
import { useChat, useConversations } from '../../hooks/useConversations'
import { formatMessageGroupTime } from '../../lib/time'
import { chatService } from '../../services'
import type { Message } from '../../types'

// 仅当"最近一条他人消息尚未产生任何文字"时显示打字指示
// 即：streaming 状态 + 最后一条非自己消息的 text 为空
function showTypingIndicator(messages: Message[]) {
    if (messages.length === 0) return false
    // 找到最后一条非自己的消息
    for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i]
        if (m.isSelf) continue
        // 找到了最后一条他人消息
        return m.type === 'text' && (!m.text || m.text.length === 0)
    }
    return false
}

function lastBotAvatar(messages: Message[]): string | undefined {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (!messages[i].isSelf) return messages[i].senderAvatar
    }
    return undefined
}

function lastBotName(messages: Message[]): string | undefined {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (!messages[i].isSelf) return messages[i].senderName
    }
    return undefined
}

function groupMessages(
    messages: Message[],
): Array<
    | { kind: 'time'; id: string; ts: number }
    | { kind: 'msg'; id: string; msg: Message }
> {
    const result: Array<
        | { kind: 'time'; id: string; ts: number }
        | { kind: 'msg'; id: string; msg: Message }
    > = []
    let lastTs = 0
    messages.forEach((m, i) => {
        if (m.timestamp - lastTs > 5 * 60 * 1000) {
            result.push({ kind: 'time', id: `t_${i}_${m.timestamp}`, ts: m.timestamp })
        }
        result.push({ kind: 'msg', id: m.id, msg: m })
        lastTs = m.timestamp
    })
    return result
}

export function ChatDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const {
        conversation,
        messages,
        streaming,
        sendText,
        sendImage,
        sendVoice,
        sendFile,
        sendLocation,
        recallMessage,
        deleteMessage,
    } = useChat(id)
    const { contacts } = useContacts()
    const { installed: installedBots } = useBots()
    const contentRef = useRef<HTMLDivElement>(null)
    const [menu, setMenu] = useState<{ msg: Message; rect: DOMRect } | null>(null)
    const [quote, setQuote] = useState<Message | null>(null)
    const [forwardMsg, setForwardMsg] = useState<Message | null>(null)
    const [allConvs, setAllConvs] = useState<Conversation[]>([])

    // 转发选择器懒加载会话列表
    useEffect(() => {
        if (forwardMsg) {
            chatService.getConversations().then(setAllConvs)
        }
    }, [forwardMsg])

    // 仅在用户位于底部时自动滚动
    useEffect(() => {
        const container = contentRef.current?.parentElement
        if (!container) return
        const threshold = 150
        const isNearBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < threshold
        if (isNearBottom) {
            const sentinel = contentRef.current
            if (sentinel) sentinel.scrollIntoView({ block: 'end' })
        }
    }, [messages])

    const grouped = groupMessages(messages)
    const isGroup = conversation?.type === 'group'
    const groupSize = isGroup ? conversation?.memberIds?.length ?? 0 : 0

    // 群聊 @候选：按 memberIds 过滤联系人+机器人
    const mentionables: Mentionable[] | undefined = useMemo(() => {
        if (!isGroup) return undefined
        return buildMentionables(contacts, installedBots, conversation?.memberIds)
    }, [isGroup, contacts, installedBots, conversation?.memberIds])

    const handleBubbleAction = async (action: BubbleAction) => {
        if (!menu) return
        const { msg } = menu
        setMenu(null)
        switch (action) {
            case 'copy':
                if (msg.text) {
                    try {
                        await navigator.clipboard.writeText(msg.text)
                    } catch {
                        /* best effort */
                    }
                }
                return
            case 'quote':
                setQuote(msg)
                return
            case 'forward':
                setForwardMsg(msg)
                return
            case 'recall':
                await recallMessage(msg.id)
                return
            case 'delete':
                await deleteMessage(msg.id)
                return
        }
    }

    const handleSendText = async (text: string, mentions: string[]) => {
        // 含引用时以 "> quoted\n\n<text>" 形式发送
        const final = quote
            ? `> ${(quote.text ?? '').split('\n').slice(0, 3).join('\n> ')}\n\n${text}`
            : text
        setQuote(null)
        await sendText(final, { mentions })
    }

    const handlePickAttachment = async (kind: string) => {
        if (!id) return
        switch (kind) {
            case 'image':
                await sendImage(`https://picsum.photos/seed/${Date.now()}/400/600`)
                break
            case 'video':
                await sendImage(`https://picsum.photos/seed/v${Date.now()}/400/600`)
                break
            case 'file':
                await sendFile('design_spec.pdf', '')
                break
            case 'location':
                await sendLocation('北京市海淀区 · 中关村大街 1 号')
                break
            case 'call':
                await sendText('[视频通话] 00:12', { mentions: [] })
                break
            case 'redpacket':
                await sendText('恭喜发财 🧧', { mentions: [] })
                break
        }
    }

    return (
        <Page
            header={
                <PageHeader
                    title={
                        <span className="text-[18px] font-semibold truncate">
                            {conversation?.title ?? ''}
                            {isGroup && (
                                <span className="ml-1 text-[13px] font-normal opacity-80">
                                    ({groupSize})
                                </span>
                            )}
                        </span>
                    }
                    left={
                        <button
                            className="text-[var(--header-text)] -ml-1 mr-1"
                            onClick={() => navigate('/messages')}
                            aria-label="back"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    }
                    right={
                        <button
                            className="text-[var(--header-text)]"
                            onClick={() => {
                                if (isGroup && id) navigate(`/group/${id}/members`)
                            }}
                        >
                            <MoreHorizontal className="w-6 h-6" />
                        </button>
                    }
                />
            }
            footer={
                <>
                    {quote && (
                        <div className="bg-[var(--bg-tertiary)] border-t border-[var(--border)] px-4 py-2 flex items-start gap-2">
                            <div className="w-1 rounded bg-[var(--accent)] self-stretch" />
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-[var(--text-secondary)]">
                                    引用 {quote.senderName}
                                </div>
                                <div className="text-[12px] text-[var(--text-tertiary)] truncate">
                                    {quote.text}
                                </div>
                            </div>
                            <button
                                className="text-[var(--text-tertiary)] text-[18px] px-1"
                                onClick={() => setQuote(null)}
                            >
                                ×
                            </button>
                        </div>
                    )}
                    <ChatComposer
                        onSend={handleSendText}
                        onPickAttachment={handlePickAttachment}
                        onSendVoice={(dur) => sendVoice(dur)}
                        mentionables={mentionables}
                        initialValue={conversation?.draft ?? ''}
                        onDraftChange={(draft) => {
                            if (id) chatService.setDraft(id, draft)
                        }}
                    />
                </>
            }
            contentClassName="py-3 bg-[var(--bg-primary)]"
        >
            {grouped.map((item) =>
                item.kind === 'time' ? (
                    <div key={item.id} className="flex justify-center my-3">
                        <span className="text-[12px] text-[var(--text-tertiary)]">
                            {formatMessageGroupTime(item.ts)}
                        </span>
                    </div>
                ) : (
                    <ChatBubble
                        key={item.id}
                        message={item.msg}
                        groupSize={groupSize}
                        onLongPress={(msg, rect) => setMenu({ msg, rect })}
                    />
                ),
            )}
            {streaming && showTypingIndicator(messages) && (
                <TypingIndicator
                    avatar={lastBotAvatar(messages)}
                    name={lastBotName(messages)}
                />
            )}
            <div ref={contentRef} />
            <BubbleMenu
                open={!!menu}
                anchorRect={menu?.rect ?? null}
                isSelf={menu?.msg.isSelf ?? false}
                onAction={handleBubbleAction}
                onClose={() => setMenu(null)}
            />

            {/* 转发选择器 */}
            {forwardMsg && (
                <div
                    className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center"
                    onClick={() => setForwardMsg(null)}
                >
                    <div
                        className="bg-[#1C1C1E] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[60vh] overflow-y-auto p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-white text-lg font-semibold mb-3 text-center">选择会话</h3>
                        {allConvs.map((conv) => (
                            <button
                                key={conv.id}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl active:bg-white/10"
                                onClick={async () => {
                                    if (!forwardMsg || !id) return
                                    const text = forwardMsg.text
                                        ? `> ${forwardMsg.text.split('\n').slice(0, 3).join('\n> ')}\n\n(转发)`
                                        : '(转发)'
                                    await chatService.sendText(conv.id, text, [])
                                    setForwardMsg(null)
                                }}
                            >
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-medium">
                                    {conv.title.charAt(0)}
                                </div>
                                <span className="text-white text-sm">{conv.title}</span>
                            </button>
                        ))}
                        <button
                            className="w-full mt-2 py-2.5 text-center text-[#FF453A] text-sm active:bg-white/5 rounded-xl"
                            onClick={() => setForwardMsg(null)}
                        >
                            取消
                        </button>
                    </div>
                </div>
            )}
        </Page>
    )
}
