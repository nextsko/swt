import { AudioLines, Keyboard, PlusCircle, SmilePlus } from 'lucide-react'
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type KeyboardEvent,
} from 'react'
import { cn } from '../../lib/cn'
import { AttachmentPanel, type AttachmentKind } from './AttachmentPanel'
import { EmojiPanel } from './EmojiPanel'
import { MentionPanel, type Mentionable } from './MentionPanel'

/**
 * ChatComposer：底部输入栏
 *
 * 能力：
 * - auto-grow textarea（1-4 行），Shift+Enter 换行，Enter 发送
 * - 语音/键盘 toggle：语音模式下显示"按住说话"按钮
 * - 加号 toggle：弹出 6 宫格附件面板
 * - @提及：输入 "@" 后弹候选面板，选中后以 "@name " 插入并记录到 mentions
 * - 安全区：paddingBottom 包含 env(safe-area-inset-bottom)
 */
export function ChatComposer({
    onSend,
    onPickAttachment,
    onSendVoice,
    mentionables,
    autoFocus,
    initialValue,
    onDraftChange,
}: {
    onSend: (text: string, mentions: string[]) => void | Promise<void>
    onPickAttachment?: (kind: AttachmentKind) => void
    onSendVoice?: (durationSec: number) => void
    /** @ 候选列表（群聊场景传入），为空时不支持 @ */
    mentionables?: Mentionable[]
    autoFocus?: boolean
    /** 初始输入文本（从草稿恢复） */
    initialValue?: string
    /** 卸载时回调，持久化草稿 */
    onDraftChange?: (draft: string) => void
}) {
    const [value, setValue] = useState(initialValue ?? '')
    const [mentionsMap, setMentionsMap] = useState<Record<string, string>>({}) // name->id
    const [mode, setMode] = useState<'text' | 'voice'>('text')
    const [panel, setPanel] = useState<null | 'attachment' | 'mention' | 'emoji'>(null)
    const [mentionQuery, setMentionQuery] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const voicePressRef = useRef<number | null>(null)

    // ---- auto-grow ----
    useLayoutEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        const max = 4 * 22 // 最多 4 行（行高 22px 估算）
        el.style.height = Math.min(el.scrollHeight, max + 20) + 'px'
    }, [value])

    useEffect(() => {
        if (autoFocus && mode === 'text') textareaRef.current?.focus()
    }, [autoFocus, mode])

    // initialValue 变化时同步（切换会话）
    useEffect(() => {
        setValue(initialValue ?? '')
    }, [initialValue])

    // 卸载/切换前，把最新输入存为草稿
    const latestRef = useRef<{ value: string; save?: (d: string) => void }>({ value: '' })
    latestRef.current.value = value
    latestRef.current.save = onDraftChange
    useEffect(() => {
        const latest = latestRef
        return () => {
            latest.current.save?.(latest.current.value)
        }
    }, [])

    // ---- 发送 ----
    const handleSend = useCallback(async () => {
        const v = value.trim()
        if (!v) return
        // 基于文本里出现的 @name 匹配已记录的 mentions
        const mentionIDs: string[] = []
        Object.entries(mentionsMap).forEach(([name, id]) => {
            if (v.includes('@' + name)) mentionIDs.push(id)
        })
        await onSend(v, mentionIDs)
        setValue('')
        setMentionsMap({})
        setPanel(null)
    }, [value, mentionsMap, onSend])

    const onKeyDown = useCallback(
        (e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleSend()
                return
            }
            // 退格删 @name 时清理 mentions 映射
            if (e.key === 'Backspace') {
                // 延迟一帧，等 state 更新
                requestAnimationFrame(() => {
                    setMentionsMap((prev) => {
                        const next: Record<string, string> = {}
                        Object.entries(prev).forEach(([name, id]) => {
                            if (textareaRef.current?.value.includes('@' + name)) {
                                next[name] = id
                            }
                        })
                        return next
                    })
                })
            }
        },
        [handleSend],
    )

    // ---- @ 检测 ----
    const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const v = e.target.value
        setValue(v)
        if (!mentionables || mentionables.length === 0) return
        // 最后一个 @ 到光标之间的内容作为过滤词
        const caret = e.target.selectionStart ?? v.length
        const before = v.slice(0, caret)
        const idx = before.lastIndexOf('@')
        if (idx >= 0) {
            const after = before.slice(idx + 1)
            if (!after.includes(' ') && after.length <= 12) {
                setMentionQuery(after)
                setPanel('mention')
                return
            }
        }
        if (panel === 'mention') setPanel(null)
    }

    // ---- 选择 @ 对象 ----
    const pickMention = (m: Mentionable) => {
        const el = textareaRef.current
        if (!el) return
        const caret = el.selectionStart ?? value.length
        const before = value.slice(0, caret)
        const after = value.slice(caret)
        const atIdx = before.lastIndexOf('@')
        if (atIdx < 0) return
        const replaced = before.slice(0, atIdx) + `@${m.name} ` + after
        setValue(replaced)
        setMentionsMap((prev) => ({ ...prev, [m.name]: m.id }))
        setPanel(null)
        requestAnimationFrame(() => {
            if (!textareaRef.current) return
            const pos = (atIdx + `@${m.name} `.length)
            textareaRef.current.setSelectionRange(pos, pos)
            textareaRef.current.focus()
        })
    }

    const mentionCandidates = useMemo(() => {
        if (!mentionables) return []
        const q = mentionQuery.trim().toLowerCase()
        if (!q) return mentionables
        return mentionables.filter((m) => m.name.toLowerCase().includes(q))
    }, [mentionables, mentionQuery])

    // ---- 语音按住模拟 ----
    const onVoicePressStart = () => {
        voicePressRef.current = Date.now()
    }
    const onVoicePressEnd = () => {
        const start = voicePressRef.current
        voicePressRef.current = null
        if (start == null) return
        const dur = Math.max(1, Math.round((Date.now() - start) / 1000))
        onSendVoice?.(dur)
    }

    const togglePanel = (next: 'attachment' | 'emoji' | null) => {
        setPanel((p) => (p === next ? null : next))
        if (next !== null) textareaRef.current?.blur()
    }

    // ---- 插入表情 ----
    const insertEmoji = useCallback((emoji: string) => {
        const el = textareaRef.current
        const caret = el?.selectionStart ?? value.length
        const before = value.slice(0, caret)
        const after = value.slice(caret)
        const next = before + emoji + after
        setValue(next)
        requestAnimationFrame(() => {
            if (!textareaRef.current) return
            const pos = caret + emoji.length
            textareaRef.current.setSelectionRange(pos, pos)
        })
    }, [value])

    // 退格：删除最后一个字符
    const handleBackspace = useCallback(() => {
        setValue((v) => Array.from(v).slice(0, -1).join(''))
    }, [])

    // 发送防抖
    const sendingRef = useRef(false)
    const debouncedSend = useCallback(async () => {
        if (sendingRef.current) return
        sendingRef.current = true
        try {
            await handleSend()
        } finally {
            setTimeout(() => { sendingRef.current = false }, 500)
        }
    }, [handleSend])

    return (
        <div
            className="flex-none bg-[var(--composer-bg)] border-t border-[var(--composer-border)]"
            style={{ backdropFilter: 'blur(22px) saturate(1.4)', WebkitBackdropFilter: 'blur(22px) saturate(1.4)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
        >
            <div className="flex items-end gap-2 px-3 py-2">
                <button
                    className="p-1.5 text-[var(--text-tertiary)] shrink-0"
                    aria-label="voice-toggle"
                    onClick={() => setMode((m) => (m === 'voice' ? 'text' : 'voice'))}
                >
                    {mode === 'voice' ? (
                        <Keyboard className="w-6 h-6" />
                    ) : (
                        <AudioLines className="w-6 h-6" />
                    )}
                </button>

                {mode === 'voice' ? (
                    <button
                        className="flex-1 h-9 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] text-[14px] text-[var(--text-secondary)] active:bg-[var(--bg-input)] select-none shadow-sm"
                        onMouseDown={onVoicePressStart}
                        onMouseUp={onVoicePressEnd}
                        onMouseLeave={onVoicePressEnd}
                        onTouchStart={onVoicePressStart}
                        onTouchEnd={onVoicePressEnd}
                    >
                        按住说话
                    </button>
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                        placeholder="输入消息…"
                        rows={1}
                        className="flex-1 min-w-0 resize-none leading-[22px] max-h-[110px] px-3.5 py-2 bg-[var(--composer-input-bg)] rounded-2xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 shadow-sm"
                    />
                )}

                <button
                    className={cn(
                        'p-1.5 shrink-0',
                        panel === 'emoji' ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]',
                    )}
                    aria-label="emoji"
                    onClick={() => togglePanel('emoji')}
                >
                    <SmilePlus className="w-6 h-6" />
                </button>

                {value.trim() && mode === 'text' ? (
                    <button
                        className="h-9 px-3 rounded-full text-white bg-[var(--accent)] text-[14px] shrink-0 active:scale-95 transition-transform"
                        onClick={debouncedSend}
                    >
                        发送
                    </button>
                ) : (
                    <button
                        className={cn(
                            'p-1.5 shrink-0 transition-transform',
                            panel === 'attachment' ? 'rotate-45 text-[var(--accent)]' : 'text-[var(--text-tertiary)]',
                        )}
                        aria-label="attachment"
                        onClick={() => togglePanel('attachment')}
                    >
                        <PlusCircle className="w-6 h-6" />
                    </button>
                )}
            </div>

            {panel === 'mention' && (
                <MentionPanel candidates={mentionCandidates} onPick={pickMention} />
            )}
            {panel === 'attachment' && (
                <AttachmentPanel
                    onPick={(k) => {
                        setPanel(null)
                        onPickAttachment?.(k)
                    }}
                />
            )}
            {panel === 'emoji' && (
                <EmojiPanel onPick={insertEmoji} onBackspace={handleBackspace} />
            )}
        </div>
    )
}
