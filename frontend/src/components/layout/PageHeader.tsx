import { Plus, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * 蓝色顶部标题栏：大标题左对齐 + 右侧操作图标。
 * 默认的右侧 Search 与 Plus 按钮支持 onSearch / onAdd 回调。
 */
export function PageHeader({
    title,
    left,
    right,
    className,
    onSearch,
    onAdd,
}: {
    title: ReactNode
    left?: ReactNode
    right?: ReactNode
    className?: string
    onSearch?: () => void
    onAdd?: () => void
}) {
    return (
        <header
            className={cn(
                'flex items-center justify-between px-5 pb-3 text-[var(--header-text)] shadow-sm',
                className,
            )}
            style={{
                background: 'var(--header-bg)',
                paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            }}
        >
            <div className="flex items-center gap-2 min-w-0">
                {left}
                <h1 className="text-[26px] font-semibold leading-none truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-5 flex-none">
                {right ?? (
                    <>
                        <button className="text-[var(--header-text)]/95 active:opacity-70" onClick={onSearch}>
                            <Search className="w-6 h-6" strokeWidth={2.2} />
                        </button>
                        <button
                            className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-[var(--header-text)]/95 active:opacity-70"
                            onClick={onAdd}
                        >
                            <Plus className="w-4 h-4" strokeWidth={3} />
                        </button>
                    </>
                )}
            </div>
        </header>
    )
}
