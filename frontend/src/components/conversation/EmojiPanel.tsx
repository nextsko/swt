import { Delete } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/cn'

/**
 * EmojiPanel: 简易表情选择面板（底部 6 栏 chip，主体 8 列网格）
 * - onPick: 点击某表情
 * - onBackspace: 退格按钮（删除上一个字符）
 */

interface EmojiGroup {
    key: string
    label: string
    items: string[]
}

const groups: EmojiGroup[] = [
    {
        key: 'face',
        label: '表情',
        items: [
            '\u{1F600}', '\u{1F603}', '\u{1F604}', '\u{1F601}',
            '\u{1F606}', '\u{1F605}', '\u{1F923}', '\u{1F602}',
            '\u{1F642}', '\u{1F643}', '\u{1F609}', '\u{1F60A}',
            '\u{1F607}', '\u{1F970}', '\u{1F60D}', '\u{1F929}',
            '\u{1F618}', '\u{1F617}', '\u263A\uFE0F', '\u{1F61A}',
            '\u{1F619}', '\u{1F972}', '\u{1F60B}', '\u{1F61B}',
            '\u{1F61C}', '\u{1F92A}', '\u{1F61D}', '\u{1F911}',
            '\u{1F917}', '\u{1F92D}', '\u{1F92B}', '\u{1F914}',
            '\u{1FAE1}', '\u{1FAE0}', '\u{1F610}', '\u{1F611}',
            '\u{1F636}', '\u{1F60F}', '\u{1F612}', '\u{1F644}',
            '\u{1F62C}', '\u{1F614}', '\u{1F62A}', '\u{1F924}',
            '\u{1F634}', '\u{1F637}', '\u{1F912}', '\u{1F915}',
        ],
    },
    {
        key: 'hand',
        label: '手势',
        items: [
            '\u{1F44D}', '\u{1F44E}', '\u{1F44C}', '\u270C\uFE0F',
            '\u{1F91E}', '\u{1F91F}', '\u{1F918}', '\u{1F919}',
            '\u{1F448}', '\u{1F449}', '\u{1F446}', '\u{1F447}',
            '\u261D\uFE0F', '\u270B', '\u{1F91A}', '\u{1F590}\uFE0F',
            '\u{1F596}', '\u{1F44B}', '\u{1F91D}', '\u{1F64F}',
            '\u{1F4AA}', '\u{1FAF0}', '\u{1FAF6}', '\u{1F44F}',
        ],
    },
    {
        key: 'heart',
        label: '符号',
        items: [
            '\u2764\uFE0F', '\u{1F9E1}', '\u{1F49B}', '\u{1F49A}',
            '\u{1F499}', '\u{1F49C}', '\u{1F5A4}', '\u{1F90D}',
            '\u{1F90E}', '\u{1F494}', '\u2763\uFE0F', '\u{1F495}',
            '\u{1F49E}', '\u{1F493}', '\u{1F497}', '\u{1F496}',
            '\u{1F498}', '\u{1F49D}', '\u{1F49F}', '\u{1F525}',
            '\u2728', '\u2B50', '\u{1F31F}', '\u{1F4A5}',
        ],
    },
    {
        key: 'animal',
        label: '动物',
        items: [
            '\u{1F436}', '\u{1F431}', '\u{1F42D}', '\u{1F439}',
            '\u{1F430}', '\u{1F98A}', '\u{1F43B}', '\u{1F43C}',
            '\u{1F428}', '\u{1F42F}', '\u{1F981}', '\u{1F42E}',
            '\u{1F437}', '\u{1F438}', '\u{1F435}', '\u{1F414}',
            '\u{1F427}', '\u{1F426}', '\u{1F424}', '\u{1F986}',
            '\u{1F985}', '\u{1F989}', '\u{1F43A}', '\u{1F984}',
        ],
    },
    {
        key: 'food',
        label: '食物',
        items: [
            '\u{1F34E}', '\u{1F34A}', '\u{1F34B}', '\u{1F34C}',
            '\u{1F349}', '\u{1F347}', '\u{1F353}', '\u{1FAD0}',
            '\u{1F348}', '\u{1F352}', '\u{1F351}', '\u{1F96D}',
            '\u{1F34D}', '\u{1F965}', '\u{1F95D}', '\u{1F345}',
            '\u{1F35E}', '\u{1F950}', '\u{1F968}', '\u{1F9C0}',
            '\u{1F354}', '\u{1F35F}', '\u{1F355}', '\u{1F32E}',
        ],
    },
    {
        key: 'sport',
        label: '活动',
        items: [
            '\u26BD', '\u{1F3C0}', '\u{1F3C8}', '\u26BE',
            '\u{1F3BE}', '\u{1F3D0}', '\u{1F3C9}', '\u{1F3B1}',
            '\u{1F3D3}', '\u{1F3F8}', '\u{1F94A}', '\u{1F94B}',
            '\u{1F3AE}', '\u{1F3B2}', '\u{1F3B3}', '\u{1F3AF}',
            '\u{1F3A8}', '\u{1F3AD}', '\u{1F3AC}', '\u{1F3A4}',
            '\u{1F3B8}', '\u{1F3B9}', '\u{1F3BB}', '\u{1F941}',
        ],
    },
]

export function EmojiPanel({
    onPick,
    onBackspace,
}: {
    onPick: (emoji: string) => void
    onBackspace?: () => void
}) {
    const [active, setActive] = useState(groups[0].key)
    const current = groups.find((g) => g.key === active) ?? groups[0]

    return (
        <div className="bg-[var(--bg-tertiary)] border-t border-[var(--border)] flex flex-col">
            {/* 顶部分组 chip */}
            <div className="flex gap-2 px-3 pt-2 overflow-x-auto">
                {groups.map((g) => (
                    <button
                        key={g.key}
                        onClick={() => setActive(g.key)}
                        className={cn(
                            'px-3 h-7 flex-none rounded-full text-[12px]',
                            active === g.key
                                ? 'bg-[var(--accent)] text-white'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]',
                        )}
                    >
                        {g.label}
                    </button>
                ))}
            </div>

            {/* 表情网格 */}
            <div className="grid grid-cols-8 gap-1 px-3 py-3 max-h-[200px] overflow-y-auto">
                {current.items.map((e, i) => (
                    <button
                        key={g(e, i)}
                        className="aspect-square flex items-center justify-center text-[22px] rounded-md active:bg-[var(--border)]"
                        onClick={() => onPick(e)}
                    >
                        {e}
                    </button>
                ))}
            </div>

            {/* 右下角退格 */}
            {onBackspace && (
                <div className="flex justify-end px-3 pb-2">
                    <button
                        className="px-3 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center gap-1 text-[var(--text-secondary)] text-[12px]"
                        onClick={onBackspace}
                    >
                        <Delete className="w-4 h-4" />
                        删除
                    </button>
                </div>
            )}
        </div>
    )
}

// key helper：emoji 内部可能有 VS16，重复使用时用 index 避免 React key 冲突
function g(e: string, i: number) {
    return `${i}:${e}`
}
