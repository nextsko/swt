import {
    FileText,
    Image as ImageIcon,
    MapPin,
    Phone,
    Video,
    Wallet,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

export type AttachmentKind =
    | 'image'
    | 'video'
    | 'call'
    | 'file'
    | 'location'
    | 'redpacket'

interface AttachmentItem {
    key: AttachmentKind
    label: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
    color: string
}

const items: AttachmentItem[] = [
    { key: 'image', label: '图片', icon: ImageIcon, color: 'text-emerald-500' },
    { key: 'video', label: '拍摄', icon: Video, color: 'text-rose-500' },
    { key: 'call', label: '视频通话', icon: Phone, color: 'text-blue-500' },
    { key: 'location', label: '位置', icon: MapPin, color: 'text-amber-500' },
    { key: 'file', label: '文件', icon: FileText, color: 'text-indigo-500' },
    { key: 'redpacket', label: '红包', icon: Wallet, color: 'text-red-500' },
]

/**
 * AttachmentPanel: 点击加号后弹出的 6 宫格面板
 */
export function AttachmentPanel({
    onPick,
}: {
    onPick: (kind: AttachmentKind) => void
}) {
    return (
        <div className="grid grid-cols-4 gap-4 px-5 py-4 bg-[var(--bg-tertiary)] border-t border-[var(--border)]">
            {items.map((it) => (
                <button
                    key={it.key}
                    className="flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity"
                    onClick={() => onPick(it.key)}
                >
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center shadow-sm">
                        <it.icon className={`w-6 h-6 ${it.color}`} strokeWidth={1.8} />
                    </div>
                    <span className="text-[11px] text-[var(--text-secondary)]">{it.label}</span>
                </button>
            ))}
        </div>
    )
}
