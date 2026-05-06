package repository

import (
	"testing"

	"changeme/backend/domain"
)

func TestNewMockStore_SeedData(t *testing.T) {
	s := NewMockStore()
	t.Cleanup(s.Close)
	convs, err := s.ListConversations()
	if err != nil {
		t.Fatalf("ListConversations() error: %v", err)
	}
	if len(convs) == 0 {
		t.Fatal("expected seed conversations, got none")
	}

	bots, err := s.ListBots()
	if err != nil {
		t.Fatalf("ListBots() error: %v", err)
	}
	if len(bots) == 0 {
		t.Fatal("expected seed bots, got none")
	}

	user, err := s.GetCurrentUser()
	if err != nil {
		t.Fatalf("GetCurrentUser() error: %v", err)
	}
	if user.ID == "" {
		t.Fatal("expected current user to have non-empty ID")
	}
}

func TestMockStore_AppendAndListMessages(t *testing.T) {
	s := NewMockStore()
	t.Cleanup(s.Close)
	convID := "c_test_conv"

	// 先创建一个会话
	s.conversations = append(s.conversations, domain.Conversation{
		ID:       convID,
		Type:     domain.ConvTypeSingle,
		Title:    "Test",
		LastTime: 1000,
	})

	msg := domain.Message{
		ID:             "m_test_1",
		ConversationID: convID,
		SenderID:       "u_me",
		SenderName:     "Test",
		Type:           domain.MsgText,
		Text:           "hello",
		Timestamp:      1000,
		IsSelf:         true,
		Status:         domain.StatusSending,
	}
	if err := s.AppendMessage(msg); err != nil {
		t.Fatalf("AppendMessage() error: %v", err)
	}

	msgs, err := s.ListMessages(convID, 10)
	if err != nil {
		t.Fatalf("ListMessages() error: %v", err)
	}
	if len(msgs) == 0 {
		t.Fatal("expected at least one message")
	}
	found := false
	for _, m := range msgs {
		if m.ID == "m_test_1" && m.Text == "hello" {
			found = true
			break
		}
	}
	if !found {
		t.Fatal("appended message not found in ListMessages result")
	}
}

func TestMockStore_UpdateMessageStatus(t *testing.T) {
	s := NewMockStore()
	t.Cleanup(s.Close)
	convID := "c_test_status"

	// 先创建一个会话和一条自己的消息
	s.conversations = append(s.conversations, domain.Conversation{
		ID:       convID,
		Type:     domain.ConvTypeSingle,
		Title:    "Status Test",
		LastTime: 1000,
	})
	s.messages[convID] = []domain.Message{
		{
			ID: "m_status_1", ConversationID: convID,
			SenderID: "u_me", SenderName: "Me",
			Type: "text", Text: "hello", Timestamp: 1000,
			IsSelf: true, Status: domain.StatusSending,
		},
	}

	if err := s.UpdateMessageStatus("m_status_1", domain.StatusRead); err != nil {
		t.Fatalf("UpdateMessageStatus() error: %v", err)
	}

	msgs, _ := s.ListMessages(convID, 10)
	for _, m := range msgs {
		if m.ID == "m_status_1" {
			if m.Status != domain.StatusRead {
				t.Fatalf("expected status %s, got %s", domain.StatusRead, m.Status)
			}
			return
		}
	}
	t.Fatal("updated message not found")
}
