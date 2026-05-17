import { cn } from '../../lib/cn'
import { Avatar } from '../common/Avatar'

/**
 * TypingIndicator：三点呼吸动画气泡。
 * 用于："对方正在输入 / AI 正在思考"提示。
 */
export function TypingIndicator({
    avatar,
    name,
}: {
    avatar?: string
    name?: string
}) {
    return (
        <div className="flex gap-2 px-3 my-1.5 items-end">
            {avatar ? (
                <Avatar src={avatar} name={name ?? ''} size={36} />
            ) : (
                <div className="w-9 h-9 shrink-0" />
            )}
            <div className="bg-[var(--bubble-other)] text-[var(--bubble-other-text)] rounded-2xl rounded-tl-sm shadow-md px-3 py-3 flex items-center gap-1">
                <Dot delay={0} />
                <Dot delay={150} />
                <Dot delay={300} />
            </div>
        </div>
    )
}

function Dot({ delay }: { delay: number }) {
    return (
        <span
            className={cn(
                'w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block',
                'animate-typing',
            )}
            style={{ animationDelay: `${delay}ms` }}
        />
    )
}
