import * as BotBinding from '../../bindings/changeme/backend/services/botservice.js'
import type { Bot, Conversation } from '../types'
import { shouldUseMock } from './mockFallback'

// mock 数据（与后端 seed.SeedBots() 保持一致）
const mockBots: Bot[] = [
    {
        id: 'bot_assistant',
        name: 'AI 助手',
        avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=bot&backgroundColor=2196F3',
        persona: '通用智能助手，擅长问答、总结、计划。',
        systemPrompt: '',
        greeting: '你好！我是 AI 助手。',
        temperature: 0.7,
        maxTokens: 2048,
        installed: true,
        accentColor: 'bg-blue-500',
    },
    {
        id: 'bot_coder',
        name: '代码专家',
        avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=coder&backgroundColor=22c55e',
        persona: '资深全栈程序员，擅长代码审查、bug 排查、架构设计。',
        systemPrompt: '',
        greeting: '贴代码或 bug，我来帮你看。',
        temperature: 0.3,
        maxTokens: 3000,
        installed: false,
        accentColor: 'bg-emerald-500',
    },
    {
        id: 'bot_translator',
        name: '翻译官',
        avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=translator&backgroundColor=f59e0b',
        persona: '中英日韩法多语互译，保留语气与上下文。',
        systemPrompt: '',
        greeting: '发中文翻英文；发外文翻中文。',
        temperature: 0.2,
        maxTokens: 1500,
        installed: false,
        accentColor: 'bg-amber-500',
    },
    {
        id: 'bot_writer',
        name: '文案写手',
        avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=writer&backgroundColor=ec4899',
        persona: '品牌/社媒/推文文案，风格多样。',
        systemPrompt: '',
        greeting: '告诉我产品、目标读者、风格偏好。',
        temperature: 0.95,
        maxTokens: 1800,
        installed: false,
        accentColor: 'bg-pink-500',
    },
    {
        id: 'bot_coach',
        name: '心理教练',
        avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=coach&backgroundColor=8b5cf6',
        persona: '温和倾听，不评判，基于 CBT 给微小行动建议。',
        systemPrompt: '',
        greeting: '我在这儿听你说。',
        temperature: 0.8,
        maxTokens: 1200,
        installed: false,
        accentColor: 'bg-violet-500',
    },
    {
        id: 'bot_planner',
        name: '旅行规划师',
        avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=planner&backgroundColor=0ea5e9',
        persona: '基于目的地、时间、预算给可执行行程。',
        systemPrompt: '',
        greeting: '想去哪？几天？预算如何？',
        temperature: 0.6,
        maxTokens: 2500,
        installed: false,
        accentColor: 'bg-sky-500',
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
            if (idx >= 0) mockBots[idx].installed = true
            return {
                id: `c_bot_${id}`,
                type: 'bot',
                title: mockBots[idx]?.name ?? id,
                avatarUrl: mockBots[idx]?.avatar ?? '',
                lastMessage: mockBots[idx]?.greeting ?? '',
                lastTime: Date.now(),
                unreadCount: 0,
                pinned: false,
                muteNotice: false,
                botId: id,
                memberIds: ['u_me', id],
            }
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
}
