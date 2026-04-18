import type { Bot, Contact } from '../../types'
import { Avatar } from '../common/Avatar'

export interface Mentionable {
    id: string
    name: string
    avatar: string
    /** 是否为机器人（UI 上加个 🤖 标识） */
    isBot: boolean
}

/**
 * MentionPanel: 输入 @ 后弹出的候选列表。
 */
export function MentionPanel({
    candidates,
    onPick,
}: {
    candidates: Mentionable[]
    onPick: (m: Mentionable) => void
}) {
    if (candidates.length === 0) {
        return (
            <div className="px-4 py-3 text-[13px] text-[#8E8E93] bg-white border-t border-[#E5E5EA]">
                无匹配成员
            </div>
        )
    }
    return (
        <div className="max-h-[44vh] overflow-y-auto bg-white border-t border-[#E5E5EA]">
            {candidates.map((c) => (
                <button
                    key={c.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 active:bg-[#F2F2F7]"
                    onClick={() => onPick(c)}
                >
                    <Avatar src={c.avatar} name={c.name} size={32} />
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-[15px] truncate">{c.name}</span>
                        {c.isBot && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 flex-none">
                                机器人
                            </span>
                        )}
                    </div>
                </button>
            ))}
        </div>
    )
}

/** 辅助：把联系人/bot 合并为 Mentionable */
export function buildMentionables(
    contacts: Contact[],
    bots: Bot[],
    memberIDs?: string[],
): Mentionable[] {
    const ids = memberIDs ? new Set(memberIDs) : null
    const out: Mentionable[] = []
    contacts.forEach((c) => {
        if (ids && !ids.has(c.id)) return
        out.push({ id: c.id, name: c.name, avatar: c.avatarUrl, isBot: false })
    })
    bots.forEach((b) => {
        if (ids && !ids.has(b.id)) return
        out.push({ id: b.id, name: b.name, avatar: b.avatar, isBot: true })
    })
    return out
}
