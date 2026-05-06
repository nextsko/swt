/**
 * Mock 数据兜底：仅在非 Wails 环境（例如浏览器直接访问 Vite dev server）下使用。
 * Wails 运行时下会优先调用真实 Go service，此文件仅用于前端独立开发预览。
 */
import type {
  Contact,
  Conversation,
  DiscoverFeature,
  Message,
  SettingItem,
  User,
} from '../types'

const avatarMe = 'https://api.dicebear.com/9.x/adventurer/svg?seed=me'
const avatarBot = 'https://api.dicebear.com/9.x/bottts/svg?seed=bot&backgroundColor=2196F3'
const avatarDino = 'https://api.dicebear.com/9.x/adventurer/svg?seed=dino'
const avatarAutumn = 'https://api.dicebear.com/9.x/adventurer/svg?seed=autumn'
const avatarScene = 'https://api.dicebear.com/9.x/adventurer/svg?seed=scene'
const avatarRain = 'https://api.dicebear.com/9.x/adventurer/svg?seed=rain'
const avatarCloud = 'https://api.dicebear.com/9.x/adventurer/svg?seed=cloud'
const avatarMeet = 'https://api.dicebear.com/9.x/shapes/svg?seed=meeting&backgroundColor=FF9800'
const avatarPeace = 'https://api.dicebear.com/9.x/adventurer/svg?seed=peace'

function ago(seconds: number): number {
  return Date.now() - seconds * 1000
}

export const mockUser: User = {
  id: 'u_me',
  name: '零零三03',
  avatarUrl: avatarMe,
  wildFireId: 'sw_003',
  bio: '代码写多了，自然就会了。',
}

export const mockConversations: Conversation[] = [
  {
    id: 'c_bot',
    type: 'bot',
    title: 'AI 助手',
    avatarUrl: avatarBot,
    lastMessage: '你好！我是你的 AI 助手，有什么可以帮你的吗？',
    lastTime: ago(30),
    unreadCount: 1,
    pinned: true,
    muteNotice: false,
    botId: 'bot_general',
  },
  {
    id: 'c_dino',
    type: 'single',
    title: '恐龙',
    avatarUrl: avatarDino,
    lastMessage: '周末一起去爬山吧 🏔️',
    lastTime: ago(7200),
    unreadCount: 0,
    pinned: false,
    muteNotice: false,
  },
  {
    id: 'c_autumn',
    type: 'single',
    title: '秋天',
    avatarUrl: avatarAutumn,
    lastMessage: '[图片]',
    lastTime: ago(28800),
    unreadCount: 3,
    pinned: false,
    muteNotice: false,
  },
  {
    id: 'c_meeting',
    type: 'group',
    title: '项目周会群',
    avatarUrl: avatarMeet,
    lastMessage: '收到，明天同步进度',
    lastTime: ago(86400),
    unreadCount: 5,
    pinned: false,
    muteNotice: true,
    memberAvatars: [avatarDino, avatarScene, avatarRain, avatarAutumn],
    memberIds: ['u_me', 'u_dino', 'u_scene', 'u_rain', 'u_autumn'],
    ownerId: 'u_dino',
  },
  {
    id: 'c_cloud',
    type: 'single',
    title: '云朵',
    avatarUrl: avatarCloud,
    lastMessage: '好的，那先这样～',
    lastTime: ago(259200),
    unreadCount: 0,
    pinned: false,
    muteNotice: false,
  },
]

export const mockMessages: Record<string, Message[]> = {
  c_bot: [
    {
      id: 'm_bot_1', conversationId: 'c_bot',
      senderId: 'bot_general', senderName: 'AI 助手', senderAvatar: avatarBot,
      type: 'text', text: '你好！我是你的 AI 助手，有什么可以帮你的吗？',
      timestamp: ago(120), isSelf: false,
      status: 'read',
    },
  ],
  c_dino: [
    {
      id: 'm_dino_1', conversationId: 'c_dino',
      senderId: 'u_me', senderName: '零零三03', senderAvatar: avatarMe,
      type: 'text', text: '在吗？',
      timestamp: ago(10800), isSelf: true,
      status: 'read',
    },
    {
      id: 'm_dino_2', conversationId: 'c_dino',
      senderId: 'u_dino', senderName: '恐龙', senderAvatar: avatarDino,
      type: 'text', text: '在呢，咋了？',
      timestamp: ago(10770), isSelf: false,
    },
    {
      id: 'm_dino_3', conversationId: 'c_dino',
      senderId: 'u_me', senderName: '零零三03', senderAvatar: avatarMe,
      type: 'text', text: '这周末有空吗？',
      timestamp: ago(7800), isSelf: true,
      status: 'read',
    },
    {
      id: 'm_dino_4', conversationId: 'c_dino',
      senderId: 'u_dino', senderName: '恐龙', senderAvatar: avatarDino,
      type: 'text', text: '周末一起去爬山吧 🏔️',
      timestamp: ago(7200), isSelf: false,
    },
  ],
  c_autumn: [
    {
      id: 'm_aut_1', conversationId: 'c_autumn',
      senderId: 'u_autumn', senderName: '秋天', senderAvatar: avatarAutumn,
      type: 'image', mediaUrl: 'https://picsum.photos/seed/autumn1/400/300',
      timestamp: ago(32400), isSelf: false,
    },
    {
      id: 'm_aut_2', conversationId: 'c_autumn',
      senderId: 'u_autumn', senderName: '秋天', senderAvatar: avatarAutumn,
      type: 'text', text: '看这个风景如何？',
      timestamp: ago(32390), isSelf: false,
    },
    {
      id: 'm_aut_3', conversationId: 'c_autumn',
      senderId: 'u_me', senderName: '零零三03', senderAvatar: avatarMe,
      type: 'text', text: '哇，这是哪里？',
      timestamp: ago(29100), isSelf: true,
      status: 'read',
    },
    {
      id: 'm_aut_4', conversationId: 'c_autumn',
      senderId: 'u_autumn', senderName: '秋天', senderAvatar: avatarAutumn,
      type: 'voice', durationSec: 12,
      timestamp: ago(28800), isSelf: false,
    },
  ],
  c_meeting: [
    {
      id: 'm_meet_1', conversationId: 'c_meeting',
      senderId: 'u_dino', senderName: '恐龙', senderAvatar: avatarDino,
      type: 'text', text: '周会提醒：明天下午 2 点同步进度',
      timestamp: ago(93600), isSelf: false,
    },
    {
      id: 'm_meet_2', conversationId: 'c_meeting',
      senderId: 'u_scene', senderName: '景色', senderAvatar: avatarScene,
      type: 'text', text: '好的',
      timestamp: ago(93480), isSelf: false,
    },
    {
      id: 'm_meet_3', conversationId: 'c_meeting',
      senderId: 'u_rain', senderName: '雨天', senderAvatar: avatarRain,
      type: 'file', text: '进度报告 Q2.pdf', fileName: '进度报告 Q2.pdf',
      mediaUrl: 'https://picsum.photos/seed/pdf/100/100',
      timestamp: ago(90000), isSelf: false,
    },
    {
      id: 'm_meet_4', conversationId: 'c_meeting',
      senderId: 'u_me', senderName: '零零三03', senderAvatar: avatarMe,
      type: 'text', text: '收到，明天同步进度',
      timestamp: ago(86400), isSelf: true,
      status: 'delivered',
    },
  ],
  c_cloud: [
    {
      id: 'm_cloud_1', conversationId: 'c_cloud',
      senderId: 'u_cloud', senderName: '云朵', senderAvatar: avatarCloud,
      type: 'redpacket', text: '新年快乐 🧧',
      timestamp: ago(345600), isSelf: false,
    },
    {
      id: 'm_cloud_2', conversationId: 'c_cloud',
      senderId: 'u_me', senderName: '零零三03', senderAvatar: avatarMe,
      type: 'text', text: '谢谢！新年快乐！🎉',
      timestamp: ago(345540), isSelf: true,
      status: 'read',
    },
    {
      id: 'm_cloud_3', conversationId: 'c_cloud',
      senderId: 'u_cloud', senderName: '云朵', senderAvatar: avatarCloud,
      type: 'text', text: '好的，那先这样～',
      timestamp: ago(259200), isSelf: false,
    },
  ],
}

export const mockSpecialContacts: Contact[] = [
  { id: 's_new_friends', name: '新的朋友', avatarUrl: avatarPeace, isSpecial: true, specialKey: 'new_friends' },
  { id: 's_fav_groups', name: '收藏群组', avatarUrl: avatarMeet, isSpecial: true, specialKey: 'favorite_groups' },
  { id: 's_channels', name: '订阅频道', avatarUrl: avatarBot, isSpecial: true, specialKey: 'subscribed_channels' },
]

export const mockContacts: Contact[] = [
  { id: 'u_dino', name: '恐龙', avatarUrl: avatarDino, wildFireId: 'wx_dinosaur' },
  { id: 'u_autumn', name: '秋天', avatarUrl: avatarAutumn, wildFireId: 'wx_autumn' },
  { id: 'u_scene', name: '景色', avatarUrl: avatarScene, wildFireId: 'wx_scenery' },
  { id: 'u_rain', name: '雨天', avatarUrl: avatarRain, wildFireId: 'wx_rainy' },
  { id: 'u_cloud', name: '云朵', avatarUrl: avatarCloud, wildFireId: 'wx_cloudy' },
]

export const mockFeatures: DiscoverFeature[] = [
  { key: 'moments', title: '朋友圈', icon: 'Image', iconColor: 'text-green-500', description: '和朋友分享生活点滴' },
  { key: 'scan', title: '扫一扫', icon: 'Scan', iconColor: 'text-blue-500', description: '扫码、识物、翻译' },
  { key: 'mini_programs', title: '小程序', icon: 'AppWindow', iconColor: 'text-orange-500', description: '免安装，用完即走' },
  { key: 'music', title: '音乐', icon: 'Music', iconColor: 'text-red-500', description: '听歌识曲、在线音乐' },
  { key: 'games', title: '游戏', icon: 'Gamepad2', iconColor: 'text-purple-500', description: '休闲小游戏' },
]

export const mockSettings: SettingItem[] = [
  { key: 'account', title: '账号与安全', icon: 'Shield', iconColor: 'text-blue-500' },
  { key: 'privacy', title: '隐私', icon: 'Lock', iconColor: 'text-green-500' },
  { key: 'notifications', title: '新消息通知', icon: 'Bell', iconColor: 'text-red-500' },
  { key: 'chat', title: '聊天', icon: 'MessageSquare', iconColor: 'text-orange-500' },
  { key: 'storage', title: '通用', icon: 'Settings', iconColor: 'text-gray-500' },
  { key: 'themes', title: '主题', icon: 'Palette', iconColor: 'text-purple-500' },
  { key: 'about', title: '关于 SWT', icon: 'Info', iconColor: 'text-cyan-500' },
  { key: 'logout', title: '退出登录', icon: 'LogOut', iconColor: 'text-red-500' },
]

/**
 * 检测当前是否为 Wails 运行环境：
 * - window.__wailsFetchPatched（Android 注入标记）
 * - window._wails 运行时对象存在
 * - 或 URL 包含 /wails/runtime 可达
 */
export function isWailsRuntime(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as { _wails?: unknown; __wailsFetchPatched?: boolean }
  return Boolean(w._wails) || Boolean(w.__wailsFetchPatched)
}

/**
 * 是否应该启用 Mock 兜底（非 Wails 环境时启用，方便浏览器独立开发预览）
 */
export function shouldUseMock(): boolean {
  return !isWailsRuntime()
}
