export function getBotConversationId(botId: string): string {
    return botId === 'bot_assistant' ? 'c_bot' : `c_bot_${botId}`
}
