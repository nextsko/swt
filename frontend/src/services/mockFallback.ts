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

const ava = (seed: string) =>
  `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`
const tile = (seed: string, bg: string) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=${bg}`

const ago = (s: number) => Date.now() - s * 1000

export const mockUser: User = {
  id: 'u_me',
  name: '零零三03',
  avatarUrl: ava('me'),
  wildFireId: 'wfid-b06cb64888564581b5e8e00c042819',
  bio: '',
}

export const mockConversations: Conversation[] = [
  {
    id: 'c_system',
    type: 'system',
    title: '系统管理员',
    avatarUrl: tile('wildfire', '2196F3'),
    lastMessage: '系统管理员: 欢迎您的归来，如果使用过程中有什么…',
    lastTime: ago(60 * 60 * 12),
    unreadCount: 2,
    pinned: false,
    muteNotice: false,
  },
  {
    id: 'c_group2',
    type: 'group',
    title: '2',
    avatarUrl: '',
    lastMessage: 'Mr Dinosaur02: [视频]',
    lastTime: ago(60 * 60 * 24 * 40),
    unreadCount: 0,
    pinned: false,
    muteNotice: true,
    memberAvatars: [ava('dino'), ava('scene'), ava('rain'), ava('autumn')],
  },
  {
    id: 'c_05',
    type: 'single',
    title: '05',
    avatarUrl: ava('scene'),
    lastMessage: '05: [音视频通话]',
    lastTime: ago(60 * 60 * 2),
    unreadCount: 0,
    pinned: false,
    muteNotice: false,
  },
  {
    id: 'c_rain',
    type: 'single',
    title: '大雨',
    avatarUrl: tile('wildfire', '2196F3'),
    lastMessage: '你们已经是好友了，可以开始聊天了。',
    lastTime: ago(60 * 60 * 24),
    unreadCount: 0,
    pinned: false,
    muteNotice: false,
  },
  {
    id: 'c_group3',
    type: 'group',
    title: '秋田01,零零三03,大雨,05',
    avatarUrl: '',
    lastMessage: '大雨: 好👍、',
    lastTime: ago(60 * 60 * 24 * 58),
    unreadCount: 0,
    pinned: false,
    muteNotice: false,
    memberAvatars: [ava('autumn'), ava('zero'), ava('rain'), tile('wildfire', '2196F3')],
  },
  {
    id: 'c_meeting',
    type: 'group',
    title: '会议测试群',
    avatarUrl: '',
    lastMessage: '秋田01: [音视频通话]',
    lastTime: ago(60 * 60 * 24 * 58),
    unreadCount: 0,
    pinned: false,
    muteNotice: false,
    memberAvatars: [tile('meet', 'FF9800'), tile('wildfire', '2196F3'), ava('zero'), ava('autumn')],
  },
  {
    id: 'c_autumn',
    type: 'single',
    title: '秋田01',
    avatarUrl: ava('dog'),
    lastMessage: '秋田01: 你们已经是好友了，可以开始聊天了。',
    lastTime: ago(60 * 60 * 24 * 58),
    unreadCount: 0,
    pinned: false,
    muteNotice: false,
  },
  {
    id: 'c_group4',
    type: 'group',
    title: '零零三03、大雨、安',
    avatarUrl: '',
    lastMessage: '大雨: 大雨 邀请 你 秋田01 加入通话',
    lastTime: ago(60 * 60 * 24 * 60),
    unreadCount: 0,
    pinned: false,
    muteNotice: false,
    memberAvatars: [ava('me'), ava('rain'), ava('peace'), ava('zero')],
  },
  {
    id: 'c_peace',
    type: 'single',
    title: '安安',
    avatarUrl: ava('cat'),
    lastMessage: '[音视频通话]',
    lastTime: ago(60 * 60 * 24 * 61),
    unreadCount: 0,
    pinned: false,
    muteNotice: false,
  },
  {
    id: 'c_group5',
    type: 'group',
    title: '丰云00,大雨,贾浩1',
    avatarUrl: '',
    lastMessage: '秋田01: 我们',
    lastTime: ago(60 * 60 * 24 * 65),
    unreadCount: 0,
    pinned: false,
    muteNotice: false,
    memberAvatars: [ava('feng'), ava('rain'), ava('jia'), ava('autumn')],
  },
]

export const mockMessages: Record<string, Message[]> = {
  c_rain: [
    {
      id: 'm_rain_tip',
      conversationId: 'c_rain',
      senderId: '',
      senderName: '',
      senderAvatar: '',
      type: 'tip',
      text: '你们已经是好友了，可以开始聊天了。',
      timestamp: ago(60 * 60 * 24),
      isSelf: false,
    },
    {
      id: 'm_rain_1',
      conversationId: 'c_rain',
      senderId: 'u_rain',
      senderName: '大雨',
      senderAvatar: tile('wildfire', '2196F3'),
      type: 'text',
      text: '你好，很高兴认识你 👋',
      timestamp: ago(60 * 60 * 20),
      isSelf: false,
    },
    {
      id: 'm_rain_2',
      conversationId: 'c_rain',
      senderId: 'u_me',
      senderName: '零零三03',
      senderAvatar: ava('me'),
      type: 'text',
      text: '你好~',
      timestamp: ago(60 * 60 * 19),
      isSelf: true,
    },
    {
      id: 'm_rain_3',
      conversationId: 'c_rain',
      senderId: 'u_rain',
      senderName: '大雨',
      senderAvatar: tile('wildfire', '2196F3'),
      type: 'voice',
      durationSec: 8,
      timestamp: ago(60 * 60 * 18),
      isSelf: false,
    },
  ],
  c_group2: [
    {
      id: 'm_g2_1',
      conversationId: 'c_group2',
      senderId: 'u_dino',
      senderName: 'Mr Dinosaur02',
      senderAvatar: ava('dino'),
      type: 'image',
      mediaUrl: 'https://picsum.photos/seed/dino1/400/600',
      timestamp: ago(60 * 60 * 24 * 40),
      isSelf: false,
    },
    {
      id: 'm_g2_2',
      conversationId: 'c_group2',
      senderId: 'u_dino',
      senderName: 'Mr Dinosaur02',
      senderAvatar: ava('dino'),
      type: 'image',
      mediaUrl: 'https://picsum.photos/seed/dino2/400/600',
      timestamp: ago(60 * 60 * 24 * 40 - 30),
      isSelf: false,
    },
    {
      id: 'm_g2_3',
      conversationId: 'c_group2',
      senderId: 'u_dino',
      senderName: 'Mr Dinosaur02',
      senderAvatar: ava('dino'),
      type: 'video',
      mediaUrl: 'https://picsum.photos/seed/dino3/400/600',
      durationSec: 3,
      timestamp: ago(60 * 60 * 24 * 40 - 60),
      isSelf: false,
    },
  ],
  c_system: [
    {
      id: 'm_sys_1',
      conversationId: 'c_system',
      senderId: 'u_system',
      senderName: '系统管理员',
      senderAvatar: tile('wildfire', '2196F3'),
      type: 'text',
      text: '欢迎您的归来，如果使用过程中有什么问题请随时联系我们。',
      timestamp: ago(60 * 60 * 24),
      isSelf: false,
    },
    {
      id: 'm_sys_2',
      conversationId: 'c_system',
      senderId: 'u_me',
      senderName: '零零三03',
      senderAvatar: ava('me'),
      type: 'text',
      text: '好的，谢谢！',
      timestamp: ago(60 * 60 * 12),
      isSelf: true,
    },
  ],
}

export const mockSpecialContacts: Contact[] = [
  { id: 'sp_new', name: '新好友', avatarUrl: '', wildFireId: '', isSpecial: true, specialKey: 'new_friends' },
  { id: 'sp_fav', name: '收藏群组', avatarUrl: '', wildFireId: '', isSpecial: true, specialKey: 'favorite_groups' },
  { id: 'sp_sub', name: '订阅频道', avatarUrl: '', wildFireId: '', isSpecial: true, specialKey: 'subscribed_channels' },
]

export const mockContacts: Contact[] = [
  { id: 'u_wildfire_tech', name: '野火技术', avatarUrl: tile('wildfire', '2196F3'), wildFireId: 'wildfire-tech', isSpecial: false },
  { id: 'u_drone', name: '无人机04', avatarUrl: ava('drone'), wildFireId: 'drone04', isSpecial: false },
  { id: 'u_autumn', name: '秋田01', avatarUrl: ava('dog'), wildFireId: 'autumn01', isSpecial: false },
  { id: 'u_jia', name: '贾浩1', avatarUrl: ava('jia'), wildFireId: 'jiahao1', isSpecial: false },
  { id: 'u_an', name: '安安', avatarUrl: ava('cat'), wildFireId: 'anan', isSpecial: false },
  { id: 'u_05', name: '05', avatarUrl: ava('scene'), wildFireId: 'scene05', isSpecial: false },
  { id: 'u_feng', name: '丰云00', avatarUrl: ava('feng'), wildFireId: 'fengyun00', isSpecial: false },
  { id: 'u_phone', name: '13866666666', avatarUrl: '', wildFireId: '13866666666', isSpecial: false },
  { id: 'u_cloud', name: '小云', avatarUrl: ava('tiger'), wildFireId: 'xiaoyun', isSpecial: false },
]

export const mockFeatures: DiscoverFeature[] = [
  { key: 'chatroom', title: '聊天室', icon: 'MessagesSquare', iconColor: 'text-green-500' },
  { key: 'robot', title: '机器人', icon: 'Bot', iconColor: 'text-blue-500' },
  { key: 'channel', title: '频道', icon: 'Megaphone', iconColor: 'text-yellow-500' },
  { key: 'docs', title: '开发文档', icon: 'FileText', iconColor: 'text-purple-500' },
]

export const mockSettings: SettingItem[] = [
  { key: 'notifications', title: '消息通知', icon: 'Bell', iconColor: 'text-yellow-500' },
  { key: 'favorites', title: '收藏', icon: 'Star', iconColor: 'text-blue-500' },
  { key: 'files', title: '文件', icon: 'FileText', iconColor: 'text-emerald-500' },
  { key: 'security', title: '账户安全', icon: 'ShieldCheck', iconColor: 'text-green-500' },
  { key: 'settings', title: '设置', icon: 'Settings', iconColor: 'text-blue-500' },
]

let fallbackEnabled: boolean | null = null

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
 * 是否应该启用 Mock 兜底（仅非 Wails 环境且非 production 构建时）
 */
export function shouldUseMock(): boolean {
  if (fallbackEnabled !== null) return fallbackEnabled
  fallbackEnabled = !isWailsRuntime() && import.meta.env.DEV
  if (fallbackEnabled) {
    console.info('[mockFallback] Enabled (browser-only dev mode)')
  }
  return fallbackEnabled
}
