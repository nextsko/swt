import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

/**
 * 会话列表中的时间格式化：
 * - 今天 -> HH:mm
 * - 昨天 -> 昨天
 * - 7 天内 -> 星期几
 * - 超过 -> MM月DD日
 */
export function formatConversationTime(ts: number): string {
    const d = dayjs(ts)
    const now = dayjs()
    const diffDays = now.startOf('day').diff(d.startOf('day'), 'day')
    if (diffDays <= 0) return d.format('HH:mm')
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.day()]
    return d.format('MM月DD日')
}

/**
 * 聊天详情页面时间分组：YYYY年MM月DD日 HH:mm
 */
export function formatMessageGroupTime(ts: number): string {
    const d = dayjs(ts)
    const now = dayjs()
    if (d.isSame(now, 'day')) return d.format('HH:mm')
    if (d.year() === now.year()) return d.format('MM月DD日 HH:mm')
    return d.format('YYYY年MM月DD日 HH:mm')
}

/**
 * 气泡旁的精简时间：只要 HH:mm
 */
export function formatMessageTime(ts: number): string {
    return dayjs(ts).format('HH:mm')
}
