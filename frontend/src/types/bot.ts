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
}
