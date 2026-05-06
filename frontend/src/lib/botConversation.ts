import type { Conversation } from '../types'

/**
 * 从会话列表中查找指定 bot 的会话 ID。
 * 后端约定：机器人会话的 BotID 字段等于 bot.id，会话 ID 不固定。
 */
export function findBotConversationId(
  conversations: Conversation[],
  botId: string,
): string | undefined {
  return conversations.find(
    (c) => c.type === 'bot' && c.botId === botId,
  )?.id
}
