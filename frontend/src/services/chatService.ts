import { Call } from '@wailsio/runtime'
import * as ChatBinding from '../../bindings/changeme/backend/services/chatservice.js'
import type { Conversation, Message, MessageStatus } from '../types'
import {
    mockConversations,
    mockMessages,
    shouldUseMock,
} from './mockFallback'

/**
 * chatService 统一封装会话/消息数据访问。
 * 所有 UI 组件应通过本 service 获取数据，而非直接调用 Wails bindings。
 *
 * 浏览器独立预览（非 Wails 环境）下自动切换到 mock 数据兜底。
 */

// 浏览器 mock 模式下维护一份会话消息本地副本（支持追加）
const localMockMessages: Record<string, Message[]> = Object.fromEntries(
    Object.entries(mockMessages).map(([k, v]) => [k, [...v]]),
)

// mock 状态推进计时器
function scheduleMockStatus(msg: Message) {
    if (!msg.isSelf) return
    setTimeout(() => applyMockStatus(msg.id, 'sent'), 150)
    setTimeout(() => applyMockStatus(msg.id, 'delivered'), 1200)
}

function applyMockStatus(messageID: string, status: MessageStatus) {
    for (const list of Object.values(localMockMessages)) {
        const idx = list.findIndex((m) => m.id === messageID)
        if (idx >= 0) {
            list[idx] = { ...list[idx], status }
            statusEmitter.emit({
                messageId: messageID,
                conversationId: list[idx].conversationId,
                status,
            })
            return
        }
    }
}

function getSortedMockConversations(): Conversation[] {
    return [...mockConversations].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return b.lastTime - a.lastTime
    })
}

const statusEmitter = {
    listeners: new Set<(ev: StatusEvent) => void>(),
    emit(ev: StatusEvent) {
        this.listeners.forEach((fn) => fn(ev))
    },
}

const conversationEmitter = {
    listeners: new Set<() => void>(),
    emit() {
        this.listeners.forEach((fn) => fn())
    },
}

function emitConversationChange() {
    conversationEmitter.emit()
}

export interface StatusEvent {
    messageId: string
    conversationId: string
    status: MessageStatus
}

export const chatService = {
    async getConversations(): Promise<Conversation[]> {
        if (shouldUseMock()) return getSortedMockConversations()
        const result = await ChatBinding.GetConversations()
        return (result ?? []) as unknown as Conversation[]
    },

    async getConversation(id: string): Promise<Conversation | null> {
        if (shouldUseMock())
            return mockConversations.find((c) => c.id === id) ?? null
        const result = await ChatBinding.GetConversation(id)
        return (result ?? null) as unknown as Conversation | null
    },

    async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
        if (shouldUseMock()) {
            const list = localMockMessages[conversationId] ?? []
            return list.slice(-limit)
        }
        const result = await ChatBinding.GetMessages(conversationId, limit)
        return (result ?? []) as unknown as Message[]
    },

    async sendText(
        conversationId: string,
        text: string,
        mentions: string[] = [],
    ): Promise<Message | null> {
        if (shouldUseMock()) {
            const msg: Message = {
                id: `m_${Date.now()}`,
                conversationId,
                senderId: 'u_me',
                senderName: '零零三03',
                senderAvatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=me',
                type: 'text',
                text: text.trim(),
                timestamp: Date.now(),
                isSelf: true,
                status: 'sending',
                mentions,
            }
            if (!localMockMessages[conversationId]) localMockMessages[conversationId] = []
            localMockMessages[conversationId].push(msg)
            syncMockConversation(conversationId)
            scheduleMockStatus(msg)
            emitConversationChange()
            return msg
        }
        const result = await ChatBinding.SendText(conversationId, text, mentions)
        if (result) emitConversationChange()
        return (result ?? null) as unknown as Message | null
    },

    async sendImage(conversationId: string, mediaUrl: string): Promise<Message | null> {
        if (shouldUseMock()) {
            const msg: Message = mockSelfMsg(conversationId, {
                type: 'image',
                mediaUrl,
            })
            localMockMessages[conversationId] = [
                ...(localMockMessages[conversationId] ?? []),
                msg,
            ]
            syncMockConversation(conversationId)
            scheduleMockStatus(msg)
            emitConversationChange()
            return msg
        }
        const res = await ChatBinding.SendImage(conversationId, mediaUrl)
        if (res) emitConversationChange()
        return (res ?? null) as unknown as Message | null
    },

    async sendVoice(conversationId: string, durationSec: number): Promise<Message | null> {
        if (shouldUseMock()) {
            const msg: Message = mockSelfMsg(conversationId, { type: 'voice', durationSec })
            localMockMessages[conversationId] = [
                ...(localMockMessages[conversationId] ?? []),
                msg,
            ]
            syncMockConversation(conversationId)
            scheduleMockStatus(msg)
            emitConversationChange()
            return msg
        }
        const res = await ChatBinding.SendVoice(conversationId, durationSec)
        if (res) emitConversationChange()
        return (res ?? null) as unknown as Message | null
    },

    async sendFile(
        conversationId: string,
        fileName: string,
        mediaUrl: string,
    ): Promise<Message | null> {
        if (shouldUseMock()) {
            const msg: Message = mockSelfMsg(conversationId, {
                type: 'file',
                fileName,
                mediaUrl,
            })
            localMockMessages[conversationId] = [
                ...(localMockMessages[conversationId] ?? []),
                msg,
            ]
            syncMockConversation(conversationId)
            scheduleMockStatus(msg)
            emitConversationChange()
            return msg
        }
        const res = await ChatBinding.SendFile(conversationId, fileName, mediaUrl)
        if (res) emitConversationChange()
        return (res ?? null) as unknown as Message | null
    },

    async sendLocation(conversationId: string, title: string): Promise<Message | null> {
        if (shouldUseMock()) {
            const msg: Message = mockSelfMsg(conversationId, { type: 'location', text: title })
            localMockMessages[conversationId] = [
                ...(localMockMessages[conversationId] ?? []),
                msg,
            ]
            syncMockConversation(conversationId)
            scheduleMockStatus(msg)
            emitConversationChange()
            return msg
        }
        const res = await ChatBinding.SendLocation(conversationId, title)
        if (res) emitConversationChange()
        return (res ?? null) as unknown as Message | null
    },

    async markRead(conversationId: string): Promise<void> {
        if (shouldUseMock()) {
            const list = localMockMessages[conversationId] ?? []
            list.forEach((m, i) => {
                if (m.isSelf && m.status !== 'read' && m.status !== 'failed') {
                    list[i] = { ...m, status: 'read' }
                }
            })
            // mock 也要清 unread
            const idx = mockConversations.findIndex((c) => c.id === conversationId)
            if (idx >= 0) mockConversations[idx].unreadCount = 0
            emitConversationChange()
            return
        }
        await ChatBinding.MarkRead(conversationId)
        emitConversationChange()
    },

    async setPinned(conversationId: string, pinned: boolean): Promise<void> {
        if (shouldUseMock()) {
            const idx = mockConversations.findIndex((c) => c.id === conversationId)
            if (idx >= 0) mockConversations[idx].pinned = pinned
            emitConversationChange()
            return
        }
        await Call.ByName('changeme/backend/services.ChatService.SetPinned', conversationId, pinned)
        emitConversationChange()
    },

    async setMute(conversationId: string, mute: boolean): Promise<void> {
        if (shouldUseMock()) {
            const idx = mockConversations.findIndex((c) => c.id === conversationId)
            if (idx >= 0) mockConversations[idx].muteNotice = mute
            emitConversationChange()
            return
        }
        await Call.ByName('changeme/backend/services.ChatService.SetMute', conversationId, mute)
        emitConversationChange()
    },

    async deleteConversation(conversationId: string): Promise<void> {
        if (shouldUseMock()) {
            const idx = mockConversations.findIndex((c) => c.id === conversationId)
            if (idx >= 0) mockConversations.splice(idx, 1)
            delete localMockMessages[conversationId]
            emitConversationChange()
            return
        }
        await Call.ByName('changeme/backend/services.ChatService.DeleteConversation', conversationId)
        emitConversationChange()
    },

    async recallMessage(messageId: string): Promise<void> {
        if (shouldUseMock()) {
            for (const list of Object.values(localMockMessages)) {
                const idx = list.findIndex((m) => m.id === messageId)
                if (idx >= 0) {
                    const conversationId = list[idx].conversationId
                    const name = list[idx].senderName || '成员'
                    list[idx] = {
                        ...list[idx],
                        type: 'tip',
                        text: `${name} 撤回了一条消息`,
                        mediaUrl: undefined,
                        fileName: undefined,
                        status: undefined,
                        isSelf: false,
                    }
                    syncMockConversation(conversationId)
                    emitConversationChange()
                    return
                }
            }
            return
        }
        await ChatBinding.RecallMessage(messageId)
        emitConversationChange()
    },

    async deleteMessage(messageId: string): Promise<void> {
        if (shouldUseMock()) {
            for (const [cid, list] of Object.entries(localMockMessages)) {
                const idx = list.findIndex((m) => m.id === messageId)
                if (idx >= 0) {
                    list.splice(idx, 1)
                    // 同步 mock 会话列表最后一条
                    const convIdx = mockConversations.findIndex((c) => c.id === cid)
                    if (convIdx >= 0 && list.length > 0) {
                        const last = list[list.length - 1]
                        mockConversations[convIdx].lastMessage = last.text ?? ''
                        mockConversations[convIdx].lastTime = last.timestamp
                    } else if (convIdx >= 0) {
                        mockConversations[convIdx].lastMessage = ''
                    }
                    emitConversationChange()
                    return
                }
            }
            return
        }
        await ChatBinding.DeleteMessage(messageId)
        emitConversationChange()
    },

    async setDraft(conversationId: string, draft: string): Promise<void> {
        if (shouldUseMock()) {
            const idx = mockConversations.findIndex((c) => c.id === conversationId)
            if (idx >= 0) mockConversations[idx].draft = draft
            emitConversationChange()
            return
        }
        await ChatBinding.SetDraft(conversationId, draft)
        emitConversationChange()
    },

    async createGroup(title: string, memberIds: string[]): Promise<Conversation | null> {
        if (shouldUseMock()) {
            const id = `c_group_${Date.now()}`
            const conv: Conversation = {
                id,
                type: 'group',
                title: title || `群聊(${memberIds.length + 1})`,
                avatarUrl: '',
                lastMessage: '群聊已创建。欢迎开始聊天～',
                lastTime: Date.now(),
                unreadCount: 0,
                pinned: false,
                muteNotice: false,
                memberIds: ['u_me', ...memberIds],
                ownerId: 'u_me',
                memberAvatars: [],
            }
            mockConversations.unshift(conv)
            localMockMessages[id] = [
                {
                    id: `m_${Date.now()}_tip`,
                    conversationId: id,
                    senderId: '',
                    senderName: '',
                    senderAvatar: '',
                    type: 'tip',
                    text: '群聊已创建。欢迎开始聊天～',
                    timestamp: Date.now(),
                    isSelf: false,
                },
            ]
            emitConversationChange()
            return conv
        }
        const res = await ChatBinding.CreateGroup(title, memberIds)
        if (res) emitConversationChange()
        return (res ?? null) as unknown as Conversation | null
    },

    notifyConversationChange(): void {
        emitConversationChange()
    },

    onConversationChange(handler: () => void): () => void {
        conversationEmitter.listeners.add(handler)
        return () => conversationEmitter.listeners.delete(handler)
    },

    onStatus(handler: (ev: StatusEvent) => void): () => void {
        if (shouldUseMock()) {
            statusEmitter.listeners.add(handler)
            return () => statusEmitter.listeners.delete(handler)
        }
        // Wails 自动生成类型里的 MessageStatus 是 enum，与我们 union 类型不完全兼容，
        // 所以在订阅边界上用 any 手动转换，前端内部继续使用清晰的 union。
        let unsubscribe = () => { }
        import('@wailsio/runtime').then((m) => {
            unsubscribe = m.Events.On('chat:status', (ev: { data?: unknown }) => {
                handler(ev.data as StatusEvent)
            })
        })
        return () => unsubscribe()
    },
}

function mockSelfMsg(conversationId: string, extra: Partial<Message>): Message {
    return {
        id: `m_${Date.now()}`,
        conversationId,
        senderId: 'u_me',
        senderName: '零零三03',
        senderAvatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=me',
        type: 'text',
        timestamp: Date.now(),
        isSelf: true,
        status: 'sending',
        ...extra,
    }
}

function syncMockConversation(conversationId: string) {
    const idx = mockConversations.findIndex((c) => c.id === conversationId)
    if (idx < 0) return
    const list = localMockMessages[conversationId] ?? []
    const last = list[list.length - 1]
    if (!last) return
    mockConversations[idx].lastMessage = getMessagePreview(last)
    mockConversations[idx].lastTime = last.timestamp
}

function getMessagePreview(message: Message): string {
    switch (message.type) {
        case 'image':
            return '[图片]'
        case 'video':
            return '[视频]'
        case 'voice':
            return '[语音]'
        case 'call':
            return '[音视频通话]'
        case 'file':
            return message.fileName ? `[文件] ${message.fileName}` : '[文件]'
        case 'location':
            return '[位置]'
        case 'redpacket':
            return '[红包]'
        case 'tip':
            return message.text ?? ''
        default:
            return message.text ?? ''
    }
}
