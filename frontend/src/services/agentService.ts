import { Events } from '@wailsio/runtime'
import * as AgentBinding from '../../bindings/changeme/backend/services/agentservice.js'
import type { Message } from '../types'
import { shouldUseMock } from './mockFallback'

/**
 * 机器人会话：首个预装的 AI 助手默认会话 ID（为旧代码保留）。
 */
export const BOT_CONVERSATION_ID = 'c_bot'

export interface ChatChunk {
    messageId: string
    conversationId: string
    delta: string
    done: boolean
    error?: string
}

export const agentService = {
    async isReady(): Promise<boolean> {
        if (shouldUseMock()) return true
        return Boolean(await AgentBinding.IsReady())
    },

    async sendToBot(conversationID: string, text: string): Promise<Message[]> {
        if (shouldUseMock()) {
            const userMsg: Message = {
                id: `m_${Date.now()}_user_mock`,
                conversationId: conversationID,
                senderId: 'u_me',
                senderName: '零零三03',
                senderAvatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=me',
                type: 'text',
                text,
                timestamp: Date.now(),
                isSelf: true,
                status: 'sent',
            }
            const botPlaceholder = await simulateMockReply(
                conversationID,
                text,
                'bot_assistant',
                'AI 助手',
            )
            return [userMsg, botPlaceholder]
        }
        const res = await AgentBinding.SendTextToBot(conversationID, text)
        return (res ?? []) as unknown as Message[]
    },

    /**
     * 群聊里触发被 @ 的 bot 回复。参数 userMessageID 是触发的用户消息 ID。
     * 返回 placeholder bot 消息列表（每个 bot 一条）。
     */
    async mentionBots(
        conversationID: string,
        userMessageID: string,
        text: string,
        botIDs: string[],
    ): Promise<Message[]> {
        if (shouldUseMock()) {
            // mock: 每个 bot 都回一段
            const out: Message[] = []
            for (const bid of botIDs) {
                const placeholder = await simulateMockReply(conversationID, text, bid, botDisplayName(bid))
                if (placeholder) out.push(placeholder)
            }
            return out
        }
        const res = await AgentBinding.MentionBots(conversationID, userMessageID, text, botIDs)
        return (res ?? []) as unknown as Message[]
    },

    onChunk(handler: (chunk: ChatChunk) => void): () => void {
        if (shouldUseMock()) {
            mockChunkListeners.add(handler)
            return () => mockChunkListeners.delete(handler)
        }
        return Events.On('chat:chunk', (ev: { data: ChatChunk }) => {
            handler(ev.data)
        })
    },
}

// ============== Mock 模式：模拟流式回答 ==============

const mockChunkListeners = new Set<(c: ChatChunk) => void>()

function emitMockChunk(chunk: ChatChunk) {
    mockChunkListeners.forEach((fn) => fn(chunk))
}

function botDisplayName(botID: string): string {
    const map: Record<string, string> = {
        bot_assistant: 'AI 助手',
        bot_coder: '代码专家',
        bot_translator: '翻译官',
        bot_writer: '文案写手',
        bot_coach: '心理教练',
        bot_planner: '旅行规划师',
    }
    return map[botID] ?? botID
}

async function simulateMockReply(
    conversationID: string,
    userText: string,
    botID: string,
    botName: string,
): Promise<Message> {
    const msgID = `m_${Date.now()}_${botID}_mock`
    const botMsg: Message = {
        id: msgID,
        conversationId: conversationID,
        senderId: botID,
        senderName: botName,
        senderAvatar: `https://api.dicebear.com/9.x/bottts/svg?seed=${botID}&backgroundColor=2196F3`,
        type: 'text',
        text: '',
        timestamp: Date.now(),
        isSelf: false,
    }
    const reply = [
        `(mock/${botName}) 收到："${userText}"\n\n`,
        '这是一段模拟流式输出，真机下由 MiniMax 实际回答。\n\n',
        '```ts\nconsole.log("hi")\n```',
    ]
    void (async () => {
        for (const chunk of reply) {
            for (const ch of chunk) {
                emitMockChunk({
                    messageId: msgID,
                    conversationId: conversationID,
                    delta: ch,
                    done: false,
                })
                await new Promise((r) => setTimeout(r, 12))
            }
        }
        emitMockChunk({
            messageId: msgID,
            conversationId: conversationID,
            delta: '',
            done: true,
        })
    })()
    return botMsg
}
