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
	ID:         "u_me",
	Name:       "零零三03",
	AvatarURL:  avatarMe,
	WildFireID: "wfid-b06cb64888564581b5e8e00c042819",
	Bio:        "",
}

// ago 返回 n 秒前的 Unix 毫秒时间戳
func ago(seconds int) int64 {
	return time.Now().Add(-time.Duration(seconds) * time.Second).UnixMilli()
}

// SeedConversations 初始会话列表（按 LastTime 倒序排列）
func SeedConversations() []domain.Conversation {
	return []domain.Conversation{
		{
			ID:          BotConversationID,
			Type:        domain.ConvTypeBot,
			Title:       "AI 助手",
			AvatarURL:   avatarBot,
			LastMessage: "你好！我是 AI 助手，有什么可以帮你的？",
			LastTime:    ago(10),
			UnreadCount: 1,
			Pinned:      true,
			BotID:       "bot_assistant",
			MemberIDs:   []string{"u_me", "bot_assistant"},
		},
		{
			ID:          "c_system",
			Type:        domain.ConvTypeSystem,
			Title:       "系统管理员",
			AvatarURL:   avatarWildFire,
			LastMessage: "系统管理员: 欢迎您的归来，如果使用过程中有什么…",
			LastTime:    ago(60 * 60 * 12), // 昨天
			UnreadCount: 2,
			MemberIDs:   []string{"u_me", "u_system"},
		},
		{
			ID:            "c_group2",
			Type:          domain.ConvTypeGroup,
			Title:         "2",
			AvatarURL:     "",
			LastMessage:   "Mr Dinosaur02: [视频]",
			LastTime:      ago(60 * 60 * 24 * 40),
			UnreadCount:   0,
			MuteNotice:    true,
			MemberAvatars: []string{avatarDino, avatarScene, avatarRain, avatarAutumn},
			MemberIDs:     []string{"u_me", "u_dino", "u_05", "u_rain", "u_autumn"},
			OwnerID:       "u_dino",
		},
		{
			ID:          "c_05",
			Type:        domain.ConvTypeSingle,
			Title:       "05",
			AvatarURL:   avatarScene,
			LastMessage: "05: [音视频通话]",
			LastTime:    ago(60 * 60 * 2), // 09:11
			UnreadCount: 0,
			MemberIDs:   []string{"u_me", "u_05"},
		},
		{
			ID:          "c_rain",
			Type:        domain.ConvTypeSingle,
			Title:       "大雨",
			AvatarURL:   avatarWildFire,
			LastMessage: "你们已经是好友了，可以开始聊天了。",
			LastTime:    ago(60 * 60 * 24), // 昨天
			UnreadCount: 0,
			MemberIDs:   []string{"u_me", "u_rain"},
		},
		{
			ID:            "c_group3",
			Type:          domain.ConvTypeGroup,
			Title:         "秋田01,零零三03,大雨,05",
			AvatarURL:     "",
			LastMessage:   "大雨: 好👍、",
			LastTime:      ago(60 * 60 * 24 * 58),
			UnreadCount:   0,
			MemberAvatars: []string{avatarAutumn, avatarZero, avatarRain, avatarWildFire},
			MemberIDs:     []string{"u_autumn", "u_me", "u_rain", "u_05"},
			OwnerID:       "u_autumn",
		},
		{
			ID:            "c_meeting",
			Type:          domain.ConvTypeGroup,
			Title:         "会议测试群",
			AvatarURL:     "",
			LastMessage:   "秋田01: [音视频通话]",
			LastTime:      ago(60 * 60 * 24 * 58),
			UnreadCount:   0,
			MemberAvatars: []string{avatarMeet, avatarWildFire, avatarZero, avatarAutumn},
			MemberIDs:     []string{"u_me", "u_autumn", "u_rain", "u_05"},
			OwnerID:       "u_me",
		},
		{
			ID:          "c_autumn",
			Type:        domain.ConvTypeSingle,
			Title:       "秋田01",
			AvatarURL:   avatarDog,
			LastMessage: "秋田01: 你们已经是好友了，可以开始聊天了。",
			LastTime:    ago(60 * 60 * 24 * 58),
			UnreadCount: 0,
			MemberIDs:   []string{"u_me", "u_autumn"},
		},
		{
			ID:            "c_group4",
			Type:          domain.ConvTypeGroup,
			Title:         "零零三03、大雨、安",
			AvatarURL:     "",
			LastMessage:   "大雨: 大雨 邀请 你 秋田01 加入通话",
			LastTime:      ago(60 * 60 * 24 * 60),
			UnreadCount:   0,
			MemberAvatars: []string{avatarMe, avatarRain, avatarPeace, avatarZero},
			MemberIDs:     []string{"u_me", "u_rain", "u_an"},
			OwnerID:       "u_me",
		},
		{
			ID:          "c_peace",
			Type:        domain.ConvTypeSingle,
			Title:       "安安",
			AvatarURL:   avatarCat,
			LastMessage: "[音视频通话]",
			LastTime:    ago(60 * 60 * 24 * 61),
			UnreadCount: 0,
			MemberIDs:   []string{"u_me", "u_an"},
		},
		{
			ID:            "c_group5",
			Type:          domain.ConvTypeGroup,
			Title:         "丰云00,大雨,贾浩1",
			AvatarURL:     "",
			LastMessage:   "秋田01: 我们",
			LastTime:      ago(60 * 60 * 24 * 65),
			UnreadCount:   0,
			MemberAvatars: []string{avatarFeng, avatarRain, avatarJia, avatarAutumn},
			MemberIDs:     []string{"u_me", "u_feng", "u_rain", "u_jia"},
			OwnerID:       "u_feng",
		},
	}
}

// SeedMessages 构造某会话的消息列表
func SeedMessages(convID string) []domain.Message {
	switch convID {
	case BotConversationID:
		return []domain.Message{
			{
				ID:             "m_bot_hello",
				ConversationID: convID,
				SenderID:       "u_bot",
				SenderName:     "AI 助手",
				SenderAvatar:   avatarBot,
				Type:           domain.MsgText,
				Text:           "你好！我是 AI 助手，支持 **Markdown** 回答、代码块高亮。\n\n试试问我：\n- 介绍一下你自己\n- 写一段 Go 的 hello world\n- 列个 Todo 给我",
				Timestamp:      ago(10),
			},
		}
	case "c_group2":
		return []domain.Message{
			{
				ID:             "m_1",
				ConversationID: convID,
				SenderID:       "u_dino",
				SenderName:     "Mr Dinosaur02",
				SenderAvatar:   avatarDino,
				Type:           domain.MsgImage,
				MediaURL:       "https://picsum.photos/seed/dino1/400/600",
				Timestamp:      ago(60 * 60 * 24 * 40),
			},
			{
				ID:             "m_2",
				ConversationID: convID,
				SenderID:       "u_dino",
				SenderName:     "Mr Dinosaur02",
				SenderAvatar:   avatarDino,
				Type:           domain.MsgImage,
				MediaURL:       "https://picsum.photos/seed/dino2/400/600",
				Timestamp:      ago(60*60*24*40 - 30),
			},
			{
				ID:             "m_3",
				ConversationID: convID,
				SenderID:       "u_dino",
				SenderName:     "Mr Dinosaur02",
				SenderAvatar:   avatarDino,
				Type:           domain.MsgVideo,
				MediaURL:       "https://picsum.photos/seed/dino3/400/600",
				DurationSec:    3,
				Timestamp:      ago(60*60*24*40 - 60),
			},
		}
	case "c_system":
		return []domain.Message{
			{
				ID:             "m_sys_1",
				ConversationID: convID,
				SenderID:       "u_system",
				SenderName:     "系统管理员",
				SenderAvatar:   avatarWildFire,
				Type:           domain.MsgText,
				Text:           "欢迎您的归来，如果使用过程中有什么问题请随时联系我们。",
				Timestamp:      ago(60 * 60 * 24),
			},
			{
				ID:             "m_sys_2",
				ConversationID: convID,
				SenderID:       "u_me",
				SenderName:     "零零三03",
				SenderAvatar:   avatarMe,
				Type:           domain.MsgText,
				Text:           "好的，谢谢！",
				Timestamp:      ago(60 * 60 * 12),
				IsSelf:         true,
			},
		}
	case "c_rain":
		return []domain.Message{
			{
				ID:             "m_rain_tip",
				ConversationID: convID,
				SenderID:       "",
				Type:           domain.MsgTip,
				Text:           "你们已经是好友了，可以开始聊天了。",
				Timestamp:      ago(60 * 60 * 24),
			},
			{
				ID:             "m_rain_1",
				ConversationID: convID,
				SenderID:       "u_rain",
				SenderName:     "大雨",
				SenderAvatar:   avatarWildFire,
				Type:           domain.MsgText,
				Text:           "你好，很高兴认识你 👋",
				Timestamp:      ago(60 * 60 * 20),
			},
			{
				ID:             "m_rain_2",
				ConversationID: convID,
				SenderID:       "u_me",
				SenderName:     "零零三03",
				SenderAvatar:   avatarMe,
				Type:           domain.MsgText,
				Text:           "你好~",
				Timestamp:      ago(60 * 60 * 19),
				IsSelf:         true,
			},
			{
				ID:             "m_rain_3",
				ConversationID: convID,
				SenderID:       "u_rain",
				SenderName:     "大雨",
				SenderAvatar:   avatarWildFire,
				Type:           domain.MsgVoice,
				DurationSec:    8,
				Timestamp:      ago(60 * 60 * 18),
			},
		}
	default:
		return []domain.Message{
			{
				ID:             "m_tip_default",
				ConversationID: convID,
				Type:           domain.MsgTip,
				Text:           "暂无消息",
				Timestamp:      ago(0),
			},
		}
	}
}

// SeedSpecialContacts 顶部固定三项
func SeedSpecialContacts() []domain.Contact {
	return []domain.Contact{
		{
			ID:         "sp_new_friends",
			Name:       "新好友",
			AvatarURL:  "",
			IsSpecial:  true,
			SpecialKey: "new_friends",
		},
		{
			ID:         "sp_favorite_groups",
			Name:       "收藏群组",
			AvatarURL:  "",
			IsSpecial:  true,
			SpecialKey: "favorite_groups",
		},
		{
			ID:         "sp_subscribed_channels",
			Name:       "订阅频道",
			AvatarURL:  "",
			IsSpecial:  true,
			SpecialKey: "subscribed_channels",
		},
	}
}

// SeedContacts 常规联系人列表
func SeedContacts() []domain.Contact {
	return []domain.Contact{
		{ID: "u_wildfire_tech", Name: "野火技术", AvatarURL: avatarWildFire, WildFireID: "wildfire-tech"},
		{ID: "u_drone", Name: "无人机04", AvatarURL: avatarDrone, WildFireID: "drone04"},
		{ID: "u_autumn", Name: "秋田01", AvatarURL: avatarDog, WildFireID: "autumn01"},
		{ID: "u_jia", Name: "贾浩1", AvatarURL: avatarJia, WildFireID: "jiahao1"},
		{ID: "u_an", Name: "安安", AvatarURL: avatarCat, WildFireID: "anan"},
		{ID: "u_05", Name: "05", AvatarURL: avatarScene, WildFireID: "scene05"},
		{ID: "u_feng", Name: "丰云00", AvatarURL: avatarFeng, WildFireID: "fengyun00"},
		{ID: "u_phone", Name: "13866666666", AvatarURL: "", WildFireID: "13866666666"},
		{ID: "u_cloud", Name: "小云", AvatarURL: avatarTiger, WildFireID: "xiaoyun"},
	}
}

// SeedDiscoverFeatures 发现 Tab 的功能项
func SeedDiscoverFeatures() []domain.DiscoverFeature {
	return []domain.DiscoverFeature{
		{Key: "chatroom", Title: "聊天室", Icon: "MessagesSquare", IconColor: "text-green-500"},
		{Key: "robot", Title: "机器人", Icon: "Bot", IconColor: "text-blue-500"},
		{Key: "channel", Title: "频道", Icon: "Megaphone", IconColor: "text-yellow-500"},
		{Key: "docs", Title: "开发文档", Icon: "FileText", IconColor: "text-purple-500"},
	}
}

// SeedSettings 我的 Tab 的设置项
func SeedSettings() []domain.SettingItem {
	return []domain.SettingItem{
		{Key: "notifications", Title: "消息通知", Icon: "Bell", IconColor: "text-yellow-500"},
		{Key: "favorites", Title: "收藏", Icon: "Star", IconColor: "text-blue-500"},
		{Key: "files", Title: "文件", Icon: "FileText", IconColor: "text-emerald-500"},
		{Key: "security", Title: "账户安全", Icon: "ShieldCheck", IconColor: "text-green-500"},
		{Key: "settings", Title: "设置", Icon: "Settings", IconColor: "text-blue-500"},
	}
}
