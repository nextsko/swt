import { Compass, Contact as ContactIcon, MessageCircle, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useConversations } from '../../hooks/useConversations'
import { cn } from '../../lib/cn'

interface TabConfig {
    to: string
    label: string
    icon: typeof MessageCircle
    badge?: number
}

export function TabBar() {
    const { conversations } = useConversations()
    const messageBadge = conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0)
    const tabs: TabConfig[] = [
        { to: '/messages', label: '信息', icon: MessageCircle, badge: messageBadge || undefined },
        { to: '/contacts', label: '联系人', icon: ContactIcon },
        { to: '/discover', label: '发现', icon: Compass },
        { to: '/profile', label: '我的', icon: User },
    ]

    return (
        <nav
            className="flex items-stretch flex-none bg-[var(--tabbar-bg)] border-t border-[var(--tabbar-border)] pt-1.5"
            style={{
                backdropFilter: 'blur(22px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
                height: 'calc(env(safe-area-inset-bottom, 0px) + 56px)',
            }}
        >
            {tabs.map((tab) => (
                <NavLink
                    key={tab.to}
                    to={tab.to}
                    className={({ isActive }) =>
                        cn(
                            'flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors',
                            isActive ? 'text-[var(--tabbar-active)]' : 'text-[var(--tabbar-inactive)]',
                        )
                    }
                >
                    <div className="relative">
                        <tab.icon className="w-6 h-6" strokeWidth={2} />
                        {tab.badge ? (
                            <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-[var(--danger)] text-white text-[11px] font-medium leading-[18px] text-center rounded-full">
                                {tab.badge}
                            </span>
                        ) : null}
                    </div>
                    <span className="text-[11px] leading-none font-medium">{tab.label}</span>
                </NavLink>
            ))}
        </nav>
    )
}
