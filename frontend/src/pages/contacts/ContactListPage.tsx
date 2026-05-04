import { Bot as BotIcon, Hash, UserPlus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../../components/common/Avatar'
import { IconTile } from '../../components/common/IconTile'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { useBots } from '../../hooks/useBots'
import { useContacts } from '../../hooks/useContacts'
import { getBotConversationId } from '../../lib/botConversation'
import type { Bot, Contact } from '../../types'

const specialIconMap: Record<
    string,
    { icon: typeof UserPlus; color: string; bg: string }
> = {
    new_friends: { icon: UserPlus, color: 'text-white', bg: 'bg-orange-400' },
    favorite_groups: { icon: Users, color: 'text-white', bg: 'bg-blue-500' },
    subscribed_channels: { icon: Hash, color: 'text-white', bg: 'bg-emerald-500' },
}

function SpecialRow({ item }: { item: Contact }) {
    const cfg = item.specialKey
        ? (specialIconMap[item.specialKey] ?? specialIconMap.new_friends)
        : specialIconMap.new_friends
    return (
        <div className="flex items-center gap-3 pl-4 bg-[var(--bg-secondary)] active:bg-[var(--bg-input)] cursor-pointer">
            <IconTile icon={cfg.icon} iconColor={cfg.color} bgColor={cfg.bg} size={22} />
            <div className="flex-1 min-w-0 py-2.5 pr-4 border-b border-[var(--border)] text-[16px] text-[var(--text-primary)] font-medium">
                {item.name}
            </div>
        </div>
    )
}

function BotRow({ bot, onOpen }: { bot: Bot; onOpen: (bot: Bot) => void }) {
    return (
        <div
            className="flex items-center gap-3 pl-4 bg-[var(--bg-secondary)] active:bg-[var(--bg-input)] cursor-pointer"
            onClick={() => onOpen(bot)}
        >
            <Avatar src={bot.avatar} name={bot.name} size={36} />
            <div className="flex-1 min-w-0 py-2.5 pr-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                    <span className="text-[16px] text-[var(--text-primary)] font-medium truncate">
                        {bot.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 flex-none">
                        机器人
                    </span>
                </div>
                <div className="text-[12px] text-[var(--text-tertiary)] mt-0.5 truncate">
                    {bot.persona}
                </div>
            </div>
        </div>
    )
}

function BotMarketRow({ onClick }: { onClick: () => void }) {
    return (
        <div
            className="flex items-center gap-3 pl-4 bg-white active:bg-[#F2F2F7] cursor-pointer"
            onClick={onClick}
        >
            <IconTile icon={BotIcon} iconColor="text-white" bgColor="bg-blue-500" size={22} />
            <div className="flex-1 min-w-0 py-2.5 pr-4 border-b border-[var(--border)] text-[16px] text-[var(--text-primary)] font-medium">
                机器人市场
            </div>
        </div>
    )
}

function ContactRow({ contact, onOpen }: { contact: Contact; onOpen: (contact: Contact) => void }) {
    return (
        <div
            className="flex items-center gap-3 pl-4 bg-[var(--bg-secondary)] active:bg-[var(--bg-input)] cursor-pointer"
            onClick={() => onOpen(contact)}
        >
            <Avatar src={contact.avatarUrl} name={contact.name} size={36} />
            <div className="flex-1 min-w-0 py-2.5 pr-4 border-b border-[var(--border)] text-[16px] text-[var(--text-primary)] font-medium truncate">
                {contact.name}
            </div>
        </div>
    )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="px-4 pt-3 pb-1 text-[12px] text-[var(--text-tertiary)] bg-[var(--bg-primary)]">
            {children}
        </div>
    )
}

export function ContactListPage() {
    const { special, contacts, loading } = useContacts()
    const { installed: installedBots } = useBots()
    const navigate = useNavigate()

    const openBotChat = (bot: Bot) => {
        navigate(`/chat/${getBotConversationId(bot.id)}`)
    }

    const openContactDetail = (contact: Contact) => {
        navigate(`/contacts/${contact.id}`)
    }

    return (
        <Page header={<PageHeader title="联系人" />}>
            {loading ? (
                <div className="p-6 text-center text-[var(--text-tertiary)] text-sm">加载中…</div>
            ) : (
                <>
                    <div>
                        {special.map((s) => (
                            <SpecialRow key={s.id} item={s} />
                        ))}
                    </div>

                    <SectionLabel>机器人</SectionLabel>
                    <div>
                        <BotMarketRow onClick={() => navigate('/bots')} />
                        {installedBots.map((b) => (
                            <BotRow key={b.id} bot={b} onOpen={openBotChat} />
                        ))}
                    </div>

                    <SectionLabel>联系人</SectionLabel>
                    <div>
                        {contacts.map((c) => (
                            <ContactRow key={c.id} contact={c} onOpen={openContactDetail} />
                        ))}
                    </div>
                </>
            )}
        </Page>
    )
}
