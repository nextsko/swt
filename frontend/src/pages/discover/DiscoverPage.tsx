import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconTile } from '../../components/common/IconTile'
import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { discoverService } from '../../services'
import type { DiscoverFeature } from '../../types'

export function DiscoverPage() {
    const navigate = useNavigate()
    const [features, setFeatures] = useState<DiscoverFeature[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        discoverService
            .getFeatures()
            .then(setFeatures)
            .finally(() => setLoading(false))
    }, [])

    const handleClick = (f: DiscoverFeature) => {
        if (f.key === 'robot') navigate('/bots')
    }

    return (
        <Page header={<PageHeader title="发现" />}>
            {loading ? (
                <div className="p-6 text-center text-[var(--text-tertiary)] text-sm">加载中…</div>
            ) : (
                <div className="bg-[var(--bg-secondary)]">
                    {features.map((f) => (
                        <div
                            key={f.key}
                            className="flex items-center gap-3 pl-4 active:bg-[var(--bg-input)] cursor-pointer"
                            onClick={() => handleClick(f)}
                        >
                            <IconTile icon={f.icon} iconColor={f.iconColor} size={22} />
                            <div className="flex-1 min-w-0 flex items-center gap-3 py-3 pr-4 border-b border-[var(--border)]">
                                <div className="flex-1 text-[16px] text-[var(--text-primary)] font-medium">
                                    {f.title}
                                </div>
                                <ChevronRight className="w-5 h-5 text-[var(--text-quaternary)]" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Page>
    )
}
