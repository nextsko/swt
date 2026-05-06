package mock

import (
	"time"

	"changeme/backend/domain"
)

// 预置的头像（使用线上免费 avatar 占位服务，也可替换为本地 asset）
const (
	avatarAdmin    = "https://api.dicebear.com/9.x/shapes/svg?seed=admin&backgroundColor=2196F3"
	avatarMe       = "https://api.dicebear.com/9.x/adventurer/svg?seed=me"
	avatarDino     = "https://api.dicebear.com/9.x/adventurer/svg?seed=dino"
	avatarScene    = "https://api.dicebear.com/9.x/adventurer/svg?seed=scene"
	avatarRain     = "https://api.dicebear.com/9.x/adventurer/svg?seed=rain"
	avatarAutumn   = "https://api.dicebear.com/9.x/adventurer/svg?seed=autumn"
	avatarMeet     = "https://api.dicebear.com/9.x/shapes/svg?seed=meeting&backgroundColor=FF9800"
	avatarDog      = "https://api.dicebear.com/9.x/adventurer/svg?seed=dog"
	avatarPeace    = "https://api.dicebear.com/9.x/adventurer/svg?seed=peace"
	avatarCat      = "https://api.dicebear.com/9.x/adventurer/svg?seed=cat"
	avatarCloud    = "https://api.dicebear.com/9.x/adventurer/svg?seed=cloud"
	avatarFeng     = "https://api.dicebear.com/9.x/adventurer/svg?seed=feng"
	avatarJia      = "https://api.dicebear.com/9.x/adventurer/svg?seed=jia"
	avatarDrone    = "https://api.dicebear.com/9.x/adventurer/svg?seed=drone"
	avatarAn       = "https://api.dicebear.com/9.x/adventurer/svg?seed=an"
	avatarZero     = "https://api.dicebear.com/9.x/adventurer/svg?seed=zero"
	avatarTiger    = "https://api.dicebear.com/9.x/adventurer/svg?seed=tiger"
	avatarWildFire = "https://api.dicebear.com/9.x/shapes/svg?seed=wildfire&backgroundColor=2196F3"
	avatarBot      = "https://api.dicebear.com/9.x/bottts/svg?seed=bot&backgroundColor=2196F3"
)

// BotConversationID 机器人会话 ID；前端据此切换到流式 AI 对话模式
const BotConversationID = "c_bot"

// CurrentUser 当前登录用户（Mock）
var CurrentUser = domain.User{
	ID:        "u_me",
	Name:      "零零三03",
	AvatarURL: avatarMe,
	Bio:       "代码写多了，自然就会了。",
}

// ago 返回 n 秒前的 Unix 毫秒时间戳
func ago(seconds int) int64 {
	return time.Now().Add(-time.Duration(seconds) * time.Second).UnixMilli()
}

// SeedConversations 初始会话列表（按 LastTime 倒序排列）
func SeedConversations() []domain.Conversation {
	now := time.Now()
	return []domain.Conversation{
		{
			ID:          "c_bot",
			Type:        domain.ConvTypeBot,
			Title:       "AI 助手",
			AvatarURL:   avatarBot,
			LastMessage: "你好！我是你的 AI 助手，有什么可以帮你的吗？",
			LastTime:    now.Add(-30 * time.Second).UnixMilli(),
			UnreadCount: 1,
			Pinned:      true,
			MuteNotice:  false,
			BotID:       "bot_general",
		},
		{
			ID:          "c_dino",
			Type:        domain.ConvTypeSingle,
			Title:       "恐龙",
			AvatarURL:   avatarDino,
			LastMessage: "周末一起去爬山吧 🏔️",
			LastTime:    now.Add(-2 * time.Hour).UnixMilli(),
			UnreadCount: 0,
			Pinned:      false,
			MuteNotice:  false,
		},
		{
			ID:          "c_autumn",
			Type:        domain.ConvTypeSingle,
			Title:       "秋天",
			AvatarURL:   avatarAutumn,
			LastMessage: "[图片]",
			LastTime:    now.Add(-8 * time.Hour).UnixMilli(),
			UnreadCount: 3,
			Pinned:      false,
			MuteNotice:  false,
		},
		{
			ID:          "c_meeting",
			Type:        domain.ConvTypeGroup,
			Title:       "项目周会群",
			AvatarURL:   avatarMeet,
			LastMessage: "收到，明天同步进度",
			LastTime:    now.Add(-24 * time.Hour).UnixMilli(),
			UnreadCount: 5,
			Pinned:      false,
			MuteNotice:  true,
			MemberAvatars: []string{avatarDino, avatarScene, avatarRain, avatarAutumn},
			MemberIDs:     []string{"u_me", "u_dino", "u_scene", "u_rain", "u_autumn"},
			OwnerID:       "u_dino",
		},
		{
			ID:          "c_cloud",
			Type:        domain.ConvTypeSingle,
			Title:       "云朵",
			AvatarURL:   avatarCloud,
			LastMessage: "好的，那先这样～",
			LastTime:    now.Add(-3 * 24 * time.Hour).UnixMilli(),
			UnreadCount: 0,
			Pinned:      false,
			MuteNotice:  false,
		},
	}
}

// SeedMessages 构造某会话的消息列表
func SeedMessages(convID string) []domain.Message {
	switch convID {
	case "c_bot":
		return []domain.Message{
			{
				ID: "m_bot_1", ConversationID: "c_bot",
				SenderID: "bot_general", SenderName: "AI 助手", SenderAvatar: avatarBot,
				Type: "text", Text: "你好！我是你的 AI 助手，有什么可以帮你的吗？",
				Timestamp: ago(120), IsSelf: false,
				Status: domain.StatusRead,
			},
		}
	case "c_dino":
		return []domain.Message{
			{
				ID: "m_dino_1", ConversationID: "c_dino",
				SenderID: "u_me", SenderName: "零零三03", SenderAvatar: avatarMe,
				Type: "text", Text: "在吗？",
				Timestamp: ago(3 * 3600), IsSelf: true,
				Status: domain.StatusRead,
			},
			{
				ID: "m_dino_2", ConversationID: "c_dino",
				SenderID: "u_dino", SenderName: "恐龙", SenderAvatar: avatarDino,
				Type: "text", Text: "在呢，咋了？",
				Timestamp: ago(3*3600 - 30), IsSelf: false,
			},
			{
				ID: "m_dino_3", ConversationID: "c_dino",
				SenderID: "u_me", SenderName: "零零三03", SenderAvatar: avatarMe,
				Type: "text", Text: "这周末有空吗？",
				Timestamp: ago(2*3600 + 600), IsSelf: true,
				Status: domain.StatusRead,
			},
			{
				ID: "m_dino_4", ConversationID: "c_dino",
				SenderID: "u_dino", SenderName: "恐龙", SenderAvatar: avatarDino,
				Type: "text", Text: "周末一起去爬山吧 🏔️",
				Timestamp: ago(2 * 3600), IsSelf: false,
			},
		}
	case "c_autumn":
		return []domain.Message{
			{
				ID: "m_aut_1", ConversationID: "c_autumn",
				SenderID: "u_autumn", SenderName: "秋天", SenderAvatar: avatarAutumn,
				Type: "image", MediaURL: "https://picsum.photos/seed/autumn1/400/300",
				Timestamp: ago(9 * 3600), IsSelf: false,
			},
			{
				ID: "m_aut_2", ConversationID: "c_autumn",
				SenderID: "u_autumn", SenderName: "秋天", SenderAvatar: avatarAutumn,
				Type: "text", Text: "看这个风景如何？",
				Timestamp: ago(9*3600 - 10), IsSelf: false,
			},
			{
				ID: "m_aut_3", ConversationID: "c_autumn",
				SenderID: "u_me", SenderName: "零零三03", SenderAvatar: avatarMe,
				Type: "text", Text: "哇，这是哪里？",
				Timestamp: ago(8*3600 + 300), IsSelf: true,
				Status: domain.StatusRead,
			},
			{
				ID: "m_aut_4", ConversationID: "c_autumn",
				SenderID: "u_autumn", SenderName: "秋天", SenderAvatar: avatarAutumn,
				Type: "voice", DurationSec: 12,
				Timestamp: ago(8 * 3600), IsSelf: false,
			},
		}
	case "c_meeting":
		return []domain.Message{
			{
				ID: "m_meet_1", ConversationID: "c_meeting",
				SenderID: "u_dino", SenderName: "恐龙", SenderAvatar: avatarDino,
				Type: "text", Text: "周会提醒：明天下午 2 点同步进度",
				Timestamp: ago(26 * 3600), IsSelf: false,
			},
			{
				ID: "m_meet_2", ConversationID: "c_meeting",
				SenderID: "u_scene", SenderName: "景色", SenderAvatar: avatarScene,
				Type: "text", Text: "好的",
				Timestamp: ago(26*3600 - 120), IsSelf: false,
			},
			{
				ID: "m_meet_3", ConversationID: "c_meeting",
				SenderID: "u_rain", SenderName: "雨天", SenderAvatar: avatarRain,
				Type: "file", Text: "进度报告 Q2.pdf", FileName: "进度报告 Q2.pdf",
				MediaURL: "https://picsum.photos/seed/pdf/100/100",
				Timestamp: ago(25 * 3600), IsSelf: false,
			},
			{
				ID: "m_meet_4", ConversationID: "c_meeting",
				SenderID: "u_me", SenderName: "零零三03", SenderAvatar: avatarMe,
				Type: "text", Text: "收到，明天同步进度",
				Timestamp: ago(24 * 3600), IsSelf: true,
				Status: domain.StatusDelivered,
			},
		}
	case "c_cloud":
		return []domain.Message{
			{
				ID: "m_cloud_1", ConversationID: "c_cloud",
				SenderID: "u_cloud", SenderName: "云朵", SenderAvatar: avatarCloud,
				Type: "redpacket", Text: "新年快乐 🧧",
				Timestamp: ago(4 * 24 * 3600), IsSelf: false,
			},
			{
				ID: "m_cloud_2", ConversationID: "c_cloud",
				SenderID: "u_me", SenderName: "零零三03", SenderAvatar: avatarMe,
				Type: "text", Text: "谢谢！新年快乐！🎉",
				Timestamp: ago(4*24*3600 - 60), IsSelf: true,
				Status: domain.StatusRead,
			},
			{
				ID: "m_cloud_3", ConversationID: "c_cloud",
				SenderID: "u_cloud", SenderName: "云朵", SenderAvatar: avatarCloud,
				Type: "text", Text: "好的，那先这样～",
				Timestamp: ago(3 * 24 * 3600), IsSelf: false,
			},
		}
	default:
		return nil
	}
}

// SeedSpecialContacts 顶部固定三项
func SeedSpecialContacts() []domain.Contact {
	return []domain.Contact{
		{ID: "s_new_friends", Name: "新的朋友", AvatarURL: avatarPeace, IsSpecial: true, SpecialKey: "new_friends"},
		{ID: "s_fav_groups", Name: "收藏群组", AvatarURL: avatarMeet, IsSpecial: true, SpecialKey: "favorite_groups"},
		{ID: "s_channels", Name: "订阅频道", AvatarURL: avatarBot, IsSpecial: true, SpecialKey: "subscribed_channels"},
	}
}

// SeedContacts 常规联系人列表
func SeedContacts() []domain.Contact {
	return []domain.Contact{
		{ID: "u_dino", Name: "恐龙", AvatarURL: avatarDino, WildFireID: "wx_dinosaur"},
		{ID: "u_autumn", Name: "秋天", AvatarURL: avatarAutumn, WildFireID: "wx_autumn"},
		{ID: "u_scene", Name: "景色", AvatarURL: avatarScene, WildFireID: "wx_scenery"},
		{ID: "u_rain", Name: "雨天", AvatarURL: avatarRain, WildFireID: "wx_rainy"},
		{ID: "u_cloud", Name: "云朵", AvatarURL: avatarCloud, WildFireID: "wx_cloudy"},
	}
}

// SeedDiscoverFeatures 发现 Tab 的功能项
func SeedDiscoverFeatures() []domain.DiscoverFeature {
	return []domain.DiscoverFeature{
		{Key: "moments", Title: "朋友圈", Icon: "Image", IconColor: "text-green-500", Description: "和朋友分享生活点滴"},
		{Key: "scan", Title: "扫一扫", Icon: "Scan", IconColor: "text-blue-500", Description: "扫码、识物、翻译"},
		{Key: "mini_programs", Title: "小程序", Icon: "AppWindow", IconColor: "text-orange-500", Description: "免安装，用完即走"},
		{Key: "music", Title: "音乐", Icon: "Music", IconColor: "text-red-500", Description: "听歌识曲、在线音乐"},
		{Key: "games", Title: "游戏", Icon: "Gamepad2", IconColor: "text-purple-500", Description: "休闲小游戏"},
	}
}

// SeedSettings 我的 Tab 的设置项
func SeedSettings() []domain.SettingItem {
	return []domain.SettingItem{
		{Key: "account", Title: "账号与安全", Icon: "Shield", IconColor: "text-blue-500"},
		{Key: "privacy", Title: "隐私", Icon: "Lock", IconColor: "text-green-500"},
		{Key: "notifications", Title: "新消息通知", Icon: "Bell", IconColor: "text-red-500"},
		{Key: "chat", Title: "聊天", Icon: "MessageSquare", IconColor: "text-orange-500"},
		{Key: "storage", Title: "通用", Icon: "Settings", IconColor: "text-gray-500"},
		{Key: "themes", Title: "主题", Icon: "Palette", IconColor: "text-purple-500"},
		{Key: "about", Title: "关于 SWT", Icon: "Info", IconColor: "text-cyan-500"},
		{Key: "logout", Title: "退出登录", Icon: "LogOut", IconColor: "text-red-500"},
	}
}
