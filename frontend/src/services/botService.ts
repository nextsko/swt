import * as BotBinding from '../../bindings/changeme/backend/services/botservice.js'
import type { Bot, Conversation } from '../types'
import { shouldUseMock } from './mockFallback'

// mock 数据（与后端 seed.SeedBots() 保持一致）
const mockBots: Bot[] = [
  {
    id: 'bot_general',
    name: 'AI 助手',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=bot&backgroundColor=2196F3',
    persona: '全能 AI 助手，帮你解决日常问题',
    systemPrompt: '你是一个有用的 AI 助手。请用中文回答问题，保持友好、专业的语气。',
    greeting: '你好！我是你的 AI 助手，有什么可以帮你的吗？',
    temperature: 0.7,
    maxTokens: 2048,
    installed: true,
    accentColor: 'bg-blue-500',
    toolIds: undefined,
  },
  {
    id: 'bot_coder',
    name: '代码助手',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=coder&backgroundColor=10B981',
    persona: '编程专家，帮你写代码、调试、架构设计',
    systemPrompt: '你是一个资深的软件工程师。擅长 Go、TypeScript、Python。',
    greeting: '嗨，我是代码助手！需要写什么代码？',
    temperature: 0.3,
    maxTokens: 4096,
    installed: false,
    accentColor: 'bg-green-500',
    toolIds: ['file', 'bash'],
  },
  {
    id: 'bot_translator',
    name: '翻译助手',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=translator&backgroundColor=8B5CF6',
    persona: '多语言翻译专家，支持中、英、日、韩等语言',
    systemPrompt: '你是一个专业的翻译。请准确翻译用户提供的内容。',
    greeting: '你好！我可以帮你翻译多种语言，发内容过来吧。',
    temperature: 0.2,
    maxTokens: 2048,
    installed: false,
    accentColor: 'bg-purple-500',
    toolIds: undefined,
  },
]

export const botService = {
    async listBots(): Promise<Bot[]> {
        if (shouldUseMock()) return [...mockBots]
        const res = await BotBinding.ListBots()
        return (res ?? []) as unknown as Bot[]
    },

    async listInstalled(): Promise<Bot[]> {
        if (shouldUseMock()) return mockBots.filter((b) => b.installed)
        const res = await BotBinding.ListInstalled()
        return (res ?? []) as unknown as Bot[]
    },

    async getBot(id: string): Promise<Bot | null> {
        if (shouldUseMock()) return mockBots.find((b) => b.id === id) ?? null
        const res = await BotBinding.GetBot(id)
        return (res ?? null) as unknown as Bot | null
    },

    async install(id: string): Promise<Conversation | null> {
        if (shouldUseMock()) {
            const idx = mockBots.findIndex((b) => b.id === id)
            if (idx < 0) return null
            mockBots[idx].installed = true
            const conv: Conversation = {
                id: `c_bot_${id}`,
                type: 'bot',
                title: mockBots[idx].name ?? id,
                avatarUrl: mockBots[idx].avatar ?? '',
                lastMessage: mockBots[idx].greeting ?? '',
                lastTime: Date.now(),
                unreadCount: 1,
                pinned: false,
                muteNotice: false,
                botId: id,
                memberIds: ['u_me', id],
            }
            const { mockConversations } = await import('./mockFallback')
            if (!mockConversations.find((c) => c.id === conv.id)) {
                mockConversations.unshift(conv)
            }
            return conv
        }
        const res = await BotBinding.InstallBot(id)
        return (res ?? null) as unknown as Conversation | null
    },

    async uninstall(id: string): Promise<void> {
        if (shouldUseMock()) {
            const idx = mockBots.findIndex((b) => b.id === id)
            if (idx >= 0) mockBots[idx].installed = false
            return
        }
        await BotBinding.UninstallBot(id)
    },

    async setToolIds(id: string, toolIds: string[]): Promise<void> {
        if (shouldUseMock()) {
            const idx = mockBots.findIndex((b) => b.id === id)
            if (idx >= 0) mockBots[idx].toolIds = toolIds
            return
        }
        await BotBinding.SetToolIds(id, toolIds)
    },
}
