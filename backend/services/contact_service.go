package services

import (
	"changeme/backend/domain"
	"changeme/backend/repository"
)

// ContactService 提供联系人相关的前端调用接口
type ContactService struct {
	repo repository.ContactRepository
}

func NewContactService(r repository.ContactRepository) *ContactService {
	return &ContactService{repo: r}
}

// GetSpecialContacts 返回顶部固定项（新好友/收藏群组/订阅频道）
func (s *ContactService) GetSpecialContacts() ([]domain.Contact, error) {
	return s.repo.ListSpecial()
}

// GetContacts 返回常规联系人列表
func (s *ContactService) GetContacts() ([]domain.Contact, error) {
	return s.repo.ListContacts()
}

// GetContact 根据 ID 获取联系人
func (s *ContactService) GetContact(id string) (*domain.Contact, error) {
	return s.repo.GetContact(id)
}
