export type MessageType =
    | 'text'
    | 'image'
    | 'video'
    | 'voice'
    | 'call'
    | 'tip'
    | 'file'
    | 'location'
    | 'redpacket'

export type MessageStatus =
    | 'sending'
    | 'sent'
    | 'delivered'
    | 'read'
    | 'failed'

export interface Message {
    id: string
    conversationId: string
    senderId: string
    senderName: string
    senderAvatar: string
    type: MessageType
    text?: string
    mediaUrl?: string
    fileName?: string
    durationSec?: number
    timestamp: number
    isSelf: boolean
    status?: MessageStatus
    readBy?: string[]
    mentions?: string[]
}
