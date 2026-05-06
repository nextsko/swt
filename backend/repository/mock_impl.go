package repository

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"changeme/backend/domain"
	"changeme/backend/mock"
)

// MockStore 统一的 Mock 数据源，线程安全，带 JSON 落盘。
// 落盘路径：~/.swt/state.json。每次变更后异步保存（debounce 一次性队列）。
type MockStore struct {
	mu            sync.RWMutex
	conversations []domain.Conversation
	messages      map[string][]domain.Message
	special       []domain.Contact
	contacts      []domain.Contact
	features      []domain.DiscoverFeature
	settings      []domain.SettingItem
	currentUser   domain.User
	bots          []domain.Bot

	statePath string
	dirty     chan struct{}
}

// persistedState 是落盘数据的序列化结构（只保存会变化的部分；静态种子由代码维护）
type persistedState struct {
	Conversations []domain.Conversation       `json:"conversations"`
	Messages      map[string][]domain.Message `json:"messages"`
	Bots          []domain.Bot                `json:"bots"`
}

// NewMockStore 构造并初始化 Mock 数据；尝试从 ~/.swt/state.json 读回。
func NewMockStore() *MockStore {
	s := &MockStore{
		conversations: mock.SeedConversations(),
		messages:      map[string][]domain.Message{},
		special:       mock.SeedSpecialContacts(),
		contacts:      mock.SeedContacts(),
		features:      mock.SeedDiscoverFeatures(),
		settings:      mock.SeedSettings(),
		currentUser:   mock.CurrentUser,
		bots:          mock.SeedBots(),
		statePath:     defaultStatePath(),
		dirty:         make(chan struct{}, 1),
	}
	// 预加载每个会话的消息
	for _, c := range s.conversations {
		s.messages[c.ID] = mock.SeedMessages(c.ID)
	}
	// 覆盖为落盘状态（如果存在）
	s.loadFromDisk()
	// 异步保存 goroutine
	go s.persistLoop()
	return s
}

func defaultStatePath() string {
	home, err := os.UserHomeDir()
	if err != nil {
		home = os.TempDir()
	}
	return filepath.Join(home, ".swt", "state.json")
}

// markDirty 请求一次异步持久化（多次调用会合并成一次）
func (s *MockStore) markDirty() {
	select {
	case s.dirty <- struct{}{}:
	default:
	}
}

// Close 关闭持久化 goroutine，释放资源。
func (s *MockStore) Close() {
	close(s.dirty)
}

// persistLoop 消费 dirty 信号并保存到磁盘
func (s *MockStore) persistLoop() {
	for range s.dirty {
		// 小延迟合并多次写
		time.Sleep(150 * time.Millisecond)
		s.saveToDisk()
	}
}

func (s *MockStore) saveToDisk() {
	s.mu.RLock()
	state := persistedState{
		Conversations: append([]domain.Conversation(nil), s.conversations...),
		Messages:      cloneMessages(s.messages),
		Bots:          append([]domain.Bot(nil), s.bots...),
	}
	s.mu.RUnlock()
	if err := os.MkdirAll(filepath.Dir(s.statePath), 0o755); err != nil {
		log.Printf("[MockStore] saveToDisk: mkdir error: %v", err)
		return
	}
	tmp := s.statePath + ".tmp"
	f, err := os.Create(tmp)
	if err != nil {
		log.Printf("[MockStore] saveToDisk: create error: %v", err)
		return
	}
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(&state); err != nil {
		_ = f.Close()
		_ = os.Remove(tmp)
		log.Printf("[MockStore] saveToDisk: encode error: %v", err)
		return
	}
	_ = f.Close()
	if err := os.Rename(tmp, s.statePath); err != nil {
		log.Printf("[MockStore] saveToDisk: rename error: %v", err)
	}
}

func (s *MockStore) loadFromDisk() {
	b, err := os.ReadFile(s.statePath)
	if err != nil {
		return
	}
	var state persistedState
	if err := json.Unmarshal(b, &state); err != nil {
		return
	}

	// Conversations：合并（落盘覆盖同 ID 的种子）
	if len(state.Conversations) > 0 {
		byID := map[string]domain.Conversation{}
		for _, c := range s.conversations {
			byID[c.ID] = c
		}
		for _, c := range state.Conversations {
			byID[c.ID] = c
		}
		s.conversations = make([]domain.Conversation, 0, len(byID))
		for _, c := range byID {
			s.conversations = append(s.conversations, c)
		}
	}

	// Messages：合并（落盘覆盖同会话 ID 的种子）
	if len(state.Messages) > 0 {
		for cid, msgs := range state.Messages {
			s.messages[cid] = msgs
		}
	}

	// Bots：合并 + 保留动态创建的 bot
	if len(state.Bots) > 0 {
		byID := map[string]domain.Bot{}
		for _, b := range s.bots {
			byID[b.ID] = b
		}
		for _, b := range state.Bots {
			if existing, ok := byID[b.ID]; ok {
				existing.Installed = b.Installed
				if b.ToolIds != nil {
					existing.ToolIds = b.ToolIds
				}
				byID[b.ID] = existing
			} else {
				byID[b.ID] = b
			}
		}
		s.bots = make([]domain.Bot, 0, len(byID))
		for _, b := range byID {
			s.bots = append(s.bots, b)
		}
	}
}

func cloneMessages(src map[string][]domain.Message) map[string][]domain.Message {
	out := make(map[string][]domain.Message, len(src))
	for k, v := range src {
		out[k] = append([]domain.Message(nil), v...)
	}
	return out
}

// ---- ConversationRepository ----

func (s *MockStore) ListConversations() ([]domain.Conversation, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.Conversation, len(s.conversations))
	copy(out, s.conversations)
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].Pinned != out[j].Pinned {
			return out[i].Pinned
		}
		return out[i].LastTime > out[j].LastTime
	})
	return out, nil
}

func (s *MockStore) GetConversation(id string) (*domain.Conversation, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, c := range s.conversations {
		if c.ID == id {
			copied := c
			return &copied, nil
		}
	}
	return nil, fmt.Errorf("conversation not found: %s", id)
}

func (s *MockStore) ListMessages(convID string, limit int) ([]domain.Message, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	msgs, ok := s.messages[convID]
	if !ok {
		return []domain.Message{}, nil
	}
	out := make([]domain.Message, len(msgs))
	copy(out, msgs)
	sort.SliceStable(out, func(i, j int) bool { return out[i].Timestamp < out[j].Timestamp })
	if limit > 0 && len(out) > limit {
		out = out[len(out)-limit:]
	}
	return out, nil
}

func (s *MockStore) AppendMessage(msg domain.Message) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.messages[msg.ConversationID] = append(s.messages[msg.ConversationID], msg)
	for i, c := range s.conversations {
		if c.ID == msg.ConversationID {
			s.conversations[i].LastMessage = previewText(msg)
			s.conversations[i].LastTime = msg.Timestamp
			// 他人消息 → 未读 +1（除非进入的是当前活跃会话，由上层 MarkRead 清零）
			if !msg.IsSelf && msg.Type != domain.MsgTip {
				s.conversations[i].UnreadCount++
			}
			break
		}
	}
	s.markDirty()
	return nil
}

// UpdateMessageText 按 messageID 更新文本内容
func (s *MockStore) UpdateMessageText(messageID, text string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for convID, msgs := range s.messages {
		for i, m := range msgs {
			if m.ID == messageID {
				s.messages[convID][i].Text = text
				for j, c := range s.conversations {
					if c.ID == convID {
						s.conversations[j].LastMessage = previewText(s.messages[convID][i])
						s.conversations[j].LastTime = s.messages[convID][i].Timestamp
						break
					}
				}
				s.markDirty()
				return nil
			}
		}
	}
	return fmt.Errorf("message not found: %s", messageID)
}

func (s *MockStore) UpdateMessageStatus(messageID string, status domain.MessageStatus) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for convID, msgs := range s.messages {
		for i, m := range msgs {
			if m.ID == messageID {
				s.messages[convID][i].Status = status
				s.markDirty()
				return nil
			}
		}
	}
	return fmt.Errorf("message not found: %s", messageID)
}

func (s *MockStore) MarkMessageReadBy(messageID, memberID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for convID, msgs := range s.messages {
		for i, m := range msgs {
			if m.ID == messageID {
				for _, existed := range m.ReadBy {
					if existed == memberID {
						return nil
					}
				}
				s.messages[convID][i].ReadBy = append(s.messages[convID][i].ReadBy, memberID)
				s.markDirty()
				return nil
			}
		}
	}
	return fmt.Errorf("message not found: %s", messageID)
}

// RecallMessage 把一条消息变为 tip 类型的 "XXX 撤回了一条消息"
func (s *MockStore) RecallMessage(messageID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for convID, msgs := range s.messages {
		for i, m := range msgs {
			if m.ID == messageID {
				name := m.SenderName
				if name == "" {
					name = "成员"
				}
				s.messages[convID][i] = domain.Message{
					ID:             m.ID,
					ConversationID: m.ConversationID,
					SenderID:       "",
					Type:           domain.MsgTip,
					Text:           fmt.Sprintf("%s 撤回了一条消息", name),
					Timestamp:      m.Timestamp,
					IsSelf:         false,
				}
				// 同步更新会话 lastMessage
				for k, c := range s.conversations {
					if c.ID == convID {
						s.conversations[k].LastMessage = fmt.Sprintf("%s 撤回了一条消息", name)
						break
					}
				}
				s.markDirty()
				return nil
			}
		}
	}
	return fmt.Errorf("message not found: %s", messageID)
}

// DeleteMessage 物理删除一条消息
func (s *MockStore) DeleteMessage(messageID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for convID, msgs := range s.messages {
		for i, m := range msgs {
			if m.ID == messageID {
				s.messages[convID] = append(msgs[:i], msgs[i+1:]...)
				// 如果是最后一条，回填 lastMessage
				if i == len(msgs)-1 {
					if newLast := s.messages[convID]; len(newLast) > 0 {
						last := newLast[len(newLast)-1]
						for k, c := range s.conversations {
							if c.ID == convID {
								s.conversations[k].LastMessage = lastMessagePreview(last)
								s.conversations[k].LastTime = last.Timestamp
								break
							}
						}
					}
				}
				s.markDirty()
				return nil
			}
		}
	}
	return fmt.Errorf("message not found: %s", messageID)
}

// lastMessagePreview 由 Message 生成会话列表预览文本。
func lastMessagePreview(m domain.Message) string {
	switch m.Type {
	case domain.MsgImage:
		return "[图片]"
	case domain.MsgVideo:
		return "[视频]"
	case domain.MsgVoice:
		return "[语音]"
	case domain.MsgFile:
		return "[文件]"
	case domain.MsgLoc:
		return "[位置]"
	case domain.MsgRed:
		return "[红包]"
	case domain.MsgCall:
		return "[通话]"
	case domain.MsgTip:
		return m.Text
	default:
		if m.Text != "" {
			return m.Text
		}
		return ""
	}
}

func (s *MockStore) MarkConversationRead(conversationID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, c := range s.conversations {
		if c.ID == conversationID {
			s.conversations[i].UnreadCount = 0
			break
		}
	}
	// 把我发出的尚未 read 的消息标记为 read
	if msgs, ok := s.messages[conversationID]; ok {
		for i, m := range msgs {
			if m.IsSelf && m.Status != domain.StatusRead && m.Status != domain.StatusFailed {
				s.messages[conversationID][i].Status = domain.StatusRead
			}
		}
	}
	s.markDirty()
	return nil
}

func (s *MockStore) SetConversationPinned(conversationID string, pinned bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, c := range s.conversations {
		if c.ID == conversationID {
			s.conversations[i].Pinned = pinned
			s.markDirty()
			return nil
		}
	}
	return fmt.Errorf("conversation not found: %s", conversationID)
}

func (s *MockStore) SetConversationMute(conversationID string, mute bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, c := range s.conversations {
		if c.ID == conversationID {
			s.conversations[i].MuteNotice = mute
			s.markDirty()
			return nil
		}
	}
	return fmt.Errorf("conversation not found: %s", conversationID)
}

func (s *MockStore) DeleteConversation(conversationID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, c := range s.conversations {
		if c.ID == conversationID {
			s.conversations = append(s.conversations[:i], s.conversations[i+1:]...)
			delete(s.messages, conversationID)
			s.markDirty()
			return nil
		}
	}
	return fmt.Errorf("conversation not found: %s", conversationID)
}

func (s *MockStore) CreateGroup(title string, ownerID string, memberIDs []string) (*domain.Conversation, error) {
	if len(memberIDs) == 0 {
		return nil, fmt.Errorf("group requires at least one member besides owner")
	}
	// 保证 owner 在列表内
	seen := map[string]bool{}
	all := []string{ownerID}
	seen[ownerID] = true
	for _, id := range memberIDs {
		if !seen[id] {
			seen[id] = true
			all = append(all, id)
		}
	}
	// 生成标题（默认用前 3 个成员名，不需要查 name 也能跑；UI 层已有 title 输入）
	if strings.TrimSpace(title) == "" {
		title = fmt.Sprintf("群聊(%d)", len(all))
	}
	id := fmt.Sprintf("c_group_%d", time.Now().UnixNano())
	conv := domain.Conversation{
		ID:            id,
		Type:          domain.ConvTypeGroup,
		Title:         title,
		AvatarURL:     "",
		LastMessage:   "",
		LastTime:      time.Now().UnixMilli(),
		UnreadCount:   0,
		MemberIDs:     all,
		MemberAvatars: s.lookupMemberAvatars(all, 4),
		OwnerID:       ownerID,
	}
	tipMsg := domain.Message{
		ID:             fmt.Sprintf("m_%d_tip", time.Now().UnixNano()),
		ConversationID: id,
		Type:           domain.MsgTip,
		Text:           "群聊已创建。欢迎开始聊天～",
		Timestamp:      conv.LastTime,
	}
	s.mu.Lock()
	s.conversations = append(s.conversations, conv)
	s.messages[id] = []domain.Message{tipMsg}
	s.conversations[len(s.conversations)-1].LastMessage = tipMsg.Text
	s.mu.Unlock()
	s.markDirty()
	return &conv, nil
}

// lookupMemberAvatars 按 ID 列表查找头像；未命中跳过；最多 max 个。
// 需在持有 mu 或调用方保证线程安全的情况下使用；此处内部仅读取 contacts/bots 快照。
func (s *MockStore) lookupMemberAvatars(ids []string, max int) []string {
	s.mu.RLock()
	contacts := append([]domain.Contact(nil), s.contacts...)
	bots := append([]domain.Bot(nil), s.bots...)
	me := s.currentUser
	s.mu.RUnlock()
	out := make([]string, 0, max)
	for _, id := range ids {
		if len(out) >= max {
			break
		}
		if id == me.ID && me.AvatarURL != "" {
			out = append(out, me.AvatarURL)
			continue
		}
		found := false
		for _, c := range contacts {
			if c.ID == id && c.AvatarURL != "" {
				out = append(out, c.AvatarURL)
				found = true
				break
			}
		}
		if found {
			continue
		}
		for _, b := range bots {
			if b.ID == id && b.Avatar != "" {
				out = append(out, b.Avatar)
				break
			}
		}
	}
	return out
}

func (s *MockStore) UpsertBotConversation(bot domain.Bot, selfID string) (*domain.Conversation, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, c := range s.conversations {
		if c.BotID == bot.ID {
			copied := s.conversations[i]
			return &copied, nil
		}
	}
	id := fmt.Sprintf("c_bot_%s", bot.ID)
	conv := domain.Conversation{
		ID:          id,
		Type:        domain.ConvTypeBot,
		Title:       bot.Name,
		AvatarURL:   bot.Avatar,
		LastMessage: bot.Greeting,
		LastTime:    time.Now().UnixMilli(),
		UnreadCount: 0,
		BotID:       bot.ID,
		MemberIDs:   []string{selfID, bot.ID},
	}
	greetMsg := domain.Message{
		ID:             fmt.Sprintf("m_%d_greet", time.Now().UnixNano()),
		ConversationID: id,
		SenderID:       bot.ID,
		SenderName:     bot.Name,
		SenderAvatar:   bot.Avatar,
		Type:           domain.MsgText,
		Text:           bot.Greeting,
		Timestamp:      conv.LastTime,
	}
	s.conversations = append(s.conversations, conv)
	s.messages[id] = []domain.Message{greetMsg}
	s.markDirty()
	return &conv, nil
}

func (s *MockStore) SetDraft(conversationID, draft string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, c := range s.conversations {
		if c.ID == conversationID {
			s.conversations[i].Draft = draft
			s.markDirty()
			return nil
		}
	}
	return fmt.Errorf("conversation not found: %s", conversationID)
}

// ---- ContactRepository ----

func (s *MockStore) ListSpecial() ([]domain.Contact, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.Contact, len(s.special))
	copy(out, s.special)
	return out, nil
}

func (s *MockStore) ListContacts() ([]domain.Contact, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.Contact, len(s.contacts))
	copy(out, s.contacts)
	return out, nil
}

func (s *MockStore) GetContact(id string) (*domain.Contact, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, c := range s.contacts {
		if c.ID == id {
			copied := c
			return &copied, nil
		}
	}
	return nil, fmt.Errorf("contact not found: %s", id)
}

// ---- BotRepository ----

func (s *MockStore) ListBots() ([]domain.Bot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.Bot, len(s.bots))
	copy(out, s.bots)
	return out, nil
}

func (s *MockStore) ListInstalled() ([]domain.Bot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.Bot, 0, len(s.bots))
	for _, b := range s.bots {
		if b.Installed {
			out = append(out, b)
		}
	}
	return out, nil
}

func (s *MockStore) GetBot(id string) (*domain.Bot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, b := range s.bots {
		if b.ID == id {
			copied := b
			return &copied, nil
		}
	}
	return nil, fmt.Errorf("bot not found: %s", id)
}

func (s *MockStore) SetInstalled(id string, installed bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, b := range s.bots {
		if b.ID == id {
			s.bots[i].Installed = installed
			s.markDirty()
			return nil
		}
	}
	return fmt.Errorf("bot not found: %s", id)
}

func (s *MockStore) SetToolIds(id string, toolIds []string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, b := range s.bots {
		if b.ID == id {
			s.bots[i].ToolIds = toolIds
			s.markDirty()
			return nil
		}
	}
	return fmt.Errorf("bot not found: %s", id)
}

func (s *MockStore) AddBot(bot domain.Bot) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, b := range s.bots {
		if b.ID == bot.ID {
			return fmt.Errorf("bot already exists: %s", bot.ID)
		}
	}
	s.bots = append(s.bots, bot)
	s.markDirty()
	return nil
}

// ---- DiscoverRepository ----

func (s *MockStore) ListFeatures() ([]domain.DiscoverFeature, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.DiscoverFeature, len(s.features))
	copy(out, s.features)
	return out, nil
}

// ---- ProfileRepository ----

func (s *MockStore) GetCurrentUser() (*domain.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	u := s.currentUser
	return &u, nil
}

func (s *MockStore) ListSettings() ([]domain.SettingItem, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.SettingItem, len(s.settings))
	copy(out, s.settings)
	return out, nil
}

// previewText 根据消息类型生成列表预览文本
func previewText(m domain.Message) string {
	switch m.Type {
	case domain.MsgText:
		return m.Text
	case domain.MsgImage:
		return "[图片]"
	case domain.MsgVideo:
		return "[视频]"
	case domain.MsgVoice:
		return "[语音]"
	case domain.MsgCall:
		return "[音视频通话]"
	case domain.MsgFile:
		if m.FileName != "" {
			return "[文件] " + m.FileName
		}
		return "[文件]"
	case domain.MsgLoc:
		return "[位置]"
	case domain.MsgRed:
		return "[红包]"
	case domain.MsgTip:
		return m.Text
	default:
		return ""
	}
}
