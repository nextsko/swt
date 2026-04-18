import { useCallback, useEffect, useState } from 'react'
import { agentService, chatService, type ChatChunk } from '../services'
import type { Conversation, Message, MessageStatus } from '../types'

/**
 * useConversations 获取会话列表
 */
export function useConversations() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const refresh = useCallback(async () => {
        setLoading(true)
        try {
            const list = await chatService.getConversations()
            setConversations(list)
            setError(null)
        } catch (e) {
            setError(e as Error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    return { conversations, loading, error, refresh }
}

export interface UseChatSendOptions {
    mentions?: string[]
    // 如果消息指定了 @ 的 bot（mentions 里包含 bot_* ID），会自动触发 bot 回复
    triggerBotReply?: boolean
}

/**
 * useChat 获取单个会话的消息 + 发送消息。
 * - 单聊-机器人会话：走 agentService.sendToBot 流式回复
 * - 群聊：如果 mention 里有 bot_*，走 agentService.mentionBots 让 bot 回复
 * - 其他：走 chatService.sendText
 *
 * 同时订阅：
 * - chat:chunk（流式增量）
 * - chat:status（消息状态流转）
 *
 * 进入时自动 markRead 清零未读。
 */
export function useChat(conversationId: string | undefined) {
    const [conversation, setConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [streaming, setStreaming] = useState(false)

    const loadAll = useCallback(async () => {
        if (!conversationId) return
        setLoading(true)
        try {
            const [c, m] = await Promise.all([
                chatService.getConversation(conversationId),
                chatService.getMessages(conversationId),
            ])
            setConversation(c)
            setMessages(m)
        } finally {
            setLoading(false)
        }
    }, [conversationId])

    useEffect(() => {
        loadAll()
    }, [loadAll])

    // 进入会话即 markRead，清零未读
    useEffect(() => {
        if (!conversationId) return
        void chatService.markRead(conversationId)
    }, [conversationId])

    // 订阅流式增量：只处理当前会话
    useEffect(() => {
        if (!conversationId) return
        const off = agentService.onChunk((chunk: ChatChunk) => {
            if (chunk.conversationId !== conversationId) return
            setMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === chunk.messageId)
                if (idx < 0) return prev
                const next = [...prev]
                const msg = { ...next[idx] }
                if (chunk.error) {
                    msg.text = (msg.text ?? '') + `\n\n**[错误] ${chunk.error}**`
                } else if (chunk.delta) {
                    msg.text = (msg.text ?? '') + chunk.delta
                }
                next[idx] = msg
                return next
            })
            if (chunk.done) setStreaming(false)
        })
        return off
    }, [conversationId])

    // 订阅消息状态事件：实时把"已发送/已送达/已读"同步到 UI
    useEffect(() => {
        if (!conversationId) return
        const off = chatService.onStatus((ev) => {
            if (ev.conversationId !== conversationId) return
            setMessages((prev) => updateMessageStatus(prev, ev.messageId, ev.status))
        })
        return off
    }, [conversationId])

    const sendText = useCallback(
        async (text: string, options: UseChatSendOptions = {}) => {
            if (!conversationId || !text.trim()) return
            const conv = conversation
            const mentions = options.mentions ?? []
            const mentionedBots = mentions.filter((id) => id.startsWith('bot_'))

            // 1) 单聊机器人 → 流式 AI
            if (conv?.type === 'bot') {
                const msgs = await agentService.sendToBot(conversationId, text)
                if (msgs && msgs.length > 0) {
                    setMessages((prev) => [...prev, ...msgs])
                    setStreaming(true)
                }
                return
            }

            // 2) 任何会话：先把文本消息入库（带 mentions）
            const msg = await chatService.sendText(conversationId, text, mentions)
            if (msg) setMessages((prev) => [...prev, msg])

            // 3) 群聊中 @ 了 bot，触发 bot 流式回复
            if (
                conv?.type === 'group' &&
                mentionedBots.length > 0 &&
                msg &&
                options.triggerBotReply !== false
            ) {
                const placeholders = await agentService.mentionBots(
                    conversationId,
                    msg.id,
                    text,
                    mentionedBots,
                )
                if (placeholders.length > 0) {
                    setMessages((prev) => [...prev, ...placeholders])
                    setStreaming(true)
                }
            }
        },
        [conversationId, conversation],
    )

    const sendImage = useCallback(
        async (mediaUrl: string) => {
            if (!conversationId) return
            const msg = await chatService.sendImage(conversationId, mediaUrl)
            if (msg) setMessages((prev) => [...prev, msg])
        },
        [conversationId],
    )

    const sendVoice = useCallback(
        async (durationSec: number) => {
            if (!conversationId) return
            const msg = await chatService.sendVoice(conversationId, durationSec)
            if (msg) setMessages((prev) => [...prev, msg])
        },
        [conversationId],
    )

    const sendFile = useCallback(
        async (fileName: string, mediaUrl: string) => {
            if (!conversationId) return
            const msg = await chatService.sendFile(conversationId, fileName, mediaUrl)
            if (msg) setMessages((prev) => [...prev, msg])
        },
        [conversationId],
    )

    const sendLocation = useCallback(
        async (title: string) => {
            if (!conversationId) return
            const msg = await chatService.sendLocation(conversationId, title)
            if (msg) setMessages((prev) => [...prev, msg])
        },
        [conversationId],
    )

    const recallMessage = useCallback(
        async (messageId: string) => {
            await chatService.recallMessage(messageId)
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === messageId
                        ? {
                            ...m,
                            type: 'tip',
                            text: `${m.senderName || '成员'} 撤回了一条消息`,
                            isSelf: false,
                            status: undefined,
                            mediaUrl: undefined,
                            fileName: undefined,
                        }
                        : m,
                ),
            )
        },
        [],
    )

    const deleteMessage = useCallback(
        async (messageId: string) => {
            await chatService.deleteMessage(messageId)
            setMessages((prev) => prev.filter((m) => m.id !== messageId))
        },
        [],
    )

    return {
        conversation,
        messages,
        loading,
        streaming,
        sendText,
        sendImage,
        sendVoice,
        sendFile,
        sendLocation,
        recallMessage,
        deleteMessage,
    }
}

function updateMessageStatus(
    list: Message[],
    id: string,
    status: MessageStatus,
): Message[] {
    const idx = list.findIndex((m) => m.id === id)
    if (idx < 0) return list
    const next = [...list]
    next[idx] = { ...next[idx], status }
    return next
}
