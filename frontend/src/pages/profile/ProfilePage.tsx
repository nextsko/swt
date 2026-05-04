import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Avatar } from '../../components/common/Avatar'
import { IconTile } from '../../components/common/IconTile'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { profileService } from '../../services'
import type { SettingItem, User } from '../../types'

function SettingRow({ item, last }: { item: SettingItem; last?: boolean }) {
    return (
        <div className="flex items-center gap-3 pl-4 bg-[var(--bg-secondary)] active:bg-[var(--bg-input)] cursor-pointer">
            <IconTile icon={item.icon} iconColor={item.iconColor} size={20} />
            <div
                className={
                    'flex-1 min-w-0 flex items-center gap-3 py-3 pr-4 ' +
                    (last ? '' : 'border-b border-[var(--border)]')
                }
            >
                <div className="flex-1 text-[16px] text-[var(--text-primary)] font-medium">
                    {item.title}
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--text-quaternary)]" />
            </div>
        </div>
    )
}

export function ProfilePage() {
    const [user, setUser] = useState<User | null>(null)
    const [settings, setSettings] = useState<SettingItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([profileService.getCurrentUser(), profileService.getSettings()])
            .then(([u, s]) => {
                setUser(u)
                setSettings(s)
            })
            .finally(() => setLoading(false))
    }, [])

    // 将设置分组：[消息通知/收藏/文件] + [账户安全] + [设置]
    const groups: SettingItem[][] = [
        settings.slice(0, 3),
        settings.slice(3, 4),
        settings.slice(4),
    ]

    return (
        <Page header={<PageHeader title="我的" />}>
            {loading ? (
                <div className="p-6 text-center text-[var(--text-tertiary)] text-sm">加载中…</div>
            ) : (
                <>
                    {user && (
                        <div className="flex items-center gap-3 px-4 py-4 bg-[var(--bg-secondary)]">
                            <Avatar src={user.avatarUrl} name={user.name} size={56} />
                            <div className="flex-1 min-w-0">
                                <div className="text-[18px] text-[var(--text-primary)] font-semibold leading-tight">
                                    {user.name}
                                </div>
                                <div className="text-[12px] text-[var(--text-tertiary)] mt-1.5 truncate">
                                    野火号: {user.wildFireId}
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[var(--text-quaternary)]" />
                        </div>
                    )}

                    {groups.map((group, idx) => (
                        <div key={idx} className="mt-2">
                            {group.map((item, i) => (
                                <SettingRow key={item.key} item={item} last={i === group.length - 1} />
                            ))}
                        </div>
                    ))}
                    <div className="h-8" />
                </>
            )}
        </Page>
    )
}
