export type ConversationType = 'single' | 'bot' | 'group' | 'system'

export interface Conversation {
    id: string
    type: ConversationType
    title: string
    avatarUrl: string
    lastMessage: string
    lastTime: number // Unix 毫秒
    unreadCount: number
    pinned: boolean
    muteNotice: boolean
    memberAvatars?: string[]
    memberIds?: string[]
    ownerId?: string
    botId?: string
    draft?: string
}
