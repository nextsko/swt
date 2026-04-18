import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/cn';

/**
 * 解析 `<think>...</think>` 思考链块（某些 LLM 如 MiniMax 会输出），
 * 分离成独立片段以便单独样式化展示（淡灰、小字），不污染正文 Markdown。
 * 仅处理最外层一对标签，支持未闭合（流式阶段）与多段。
 */
function splitThinkBlocks(text: string): Array<
    | { kind: 'think'; content: string }
    | { kind: 'text'; content: string }
> {
    const result: Array<
        | { kind: 'think'; content: string }
        | { kind: 'text'; content: string }
    > = []
    let remaining = text
    while (true) {
        const openIdx = remaining.indexOf('<think>')
        if (openIdx === -1) {
            if (remaining) result.push({ kind: 'text', content: remaining })
            break
        }
        if (openIdx > 0) {
            result.push({ kind: 'text', content: remaining.slice(0, openIdx) })
        }
        const afterOpen = remaining.slice(openIdx + 7)
        const closeIdx = afterOpen.indexOf('</think>')
        if (closeIdx === -1) {
            // 未闭合（流式中）：把剩余全部视为 think，等下次 token 到达再刷新
            result.push({ kind: 'think', content: afterOpen })
            break
        }
        result.push({ kind: 'think', content: afterOpen.slice(0, closeIdx) })
        remaining = afterOpen.slice(closeIdx + 8)
    }
    return result
}

/**
 * MarkdownText: 聊天气泡里的 Markdown 渲染器
 * - GFM 扩展：表格、任务列表、删除线、自动链接
 * - 代码块高亮：rehype-highlight (highlight.js)
 * - 受控样式：继承气泡字色；链接、代码块颜色自适应
 * - 自动识别 `<think>` 思考链块并低调展示
 */
export function MarkdownText({
    text,
    isSelf,
    className,
}: {
    text: string
    isSelf?: boolean
    className?: string
}) {
    const parts = splitThinkBlocks(text)
    return (
        <div
            className={cn(
                'markdown-bubble leading-relaxed text-[15px] break-words',
                isSelf ? 'markdown-self' : 'markdown-other',
                className,
            )}
        >
            {parts.map((p, i) =>
                p.kind === 'think' ? (
                    <details
                        key={i}
                        className={cn(
                            'my-1 text-[12px] rounded',
                            isSelf
                                ? 'text-white/70'
                                : 'text-[#8E8E93]',
                        )}
                    >
                        <summary className="cursor-pointer select-none italic opacity-80">
                            思考过程
                        </summary>
                        <div className="mt-1 whitespace-pre-wrap opacity-80">
                            {p.content.trim()}
                        </div>
                    </details>
                ) : (
                    <MarkdownBlock key={i} text={p.content} isSelf={isSelf} />
                ),
            )}
        </div>
    )
}

function MarkdownBlock({ text, isSelf }: { text: string; isSelf?: boolean }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
                // 限制嵌套元素的默认外边距，让聊天气泡更紧凑
                p: ({ children }) => <p className="m-0 whitespace-pre-wrap">{children}</p>,
                ul: ({ children }) => (
                    <ul className="my-1 pl-5 list-disc space-y-0.5">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="my-1 pl-5 list-decimal space-y-0.5">{children}</ol>
                ),
                h1: ({ children }) => (
                    <h1 className="text-[17px] font-semibold my-1">{children}</h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-[16px] font-semibold my-1">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-[15px] font-semibold my-1">{children}</h3>
                ),
                a: ({ href, children }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={isSelf ? 'underline text-white' : 'underline text-[#2196F3]'}
                    >
                        {children}
                    </a>
                ),
                code: ({ className, children, ...props }) => {
                    const isInline = !className
                    if (isInline) {
                        return (
                            <code
                                className={cn(
                                    'px-1 py-0.5 rounded text-[13px] font-mono',
                                    isSelf ? 'bg-white/20' : 'bg-[#F2F2F7]',
                                )}
                                {...props}
                            >
                                {children}
                            </code>
                        )
                    }
                    return (
                        <code className={cn(className, 'text-[13px]')} {...props}>
                            {children}
                        </code>
                    )
                },
                pre: ({ children }) => (
                    <pre
                        className={cn(
                            'my-1.5 p-2.5 rounded-lg overflow-x-auto text-[13px] font-mono',
                            isSelf ? 'bg-black/30 text-white' : 'bg-[#1e1e1e] text-white',
                        )}
                    >
                        {children}
                    </pre>
                ),
                blockquote: ({ children }) => (
                    <blockquote
                        className={cn(
                            'border-l-2 pl-2 my-1 italic',
                            isSelf ? 'border-white/50' : 'border-[#C7C7CC]',
                        )}
                    >
                        {children}
                    </blockquote>
                ),
                table: ({ children }) => (
                    <div className="overflow-x-auto my-1">
                        <table className="border-collapse text-[13px]">{children}</table>
                    </div>
                ),
                th: ({ children }) => (
                    <th className="border border-[#E5E5EA] px-2 py-1 text-left font-semibold">
                        {children}
                    </th>
                ),
                td: ({ children }) => (
                    <td className="border border-[#E5E5EA] px-2 py-1">{children}</td>
                ),
            }}
        >
            {text}
        </ReactMarkdown>
    )
}
