export interface Bot {
  id: string
  name: string
  avatar: string
  persona: string
  systemPrompt: string
  greeting: string
  temperature: number
  maxTokens: number
  installed: boolean
  accentColor: string
  /** 可用工具 ID 列表（空=全部工具；否则只启用列出的 toolset） */
  toolIds?: string[]
}
