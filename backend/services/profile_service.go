package services

import (
	"changeme/backend/domain"
	"changeme/backend/repository"
)

// ProfileService 提供个人中心数据
type ProfileService struct {
	repo repository.ProfileRepository
}

func NewProfileService(r repository.ProfileRepository) *ProfileService {
	return &ProfileService{repo: r}
}

// GetCurrentUser 返回当前登录用户信息
func (s *ProfileService) GetCurrentUser() (*domain.User, error) {
	return s.repo.GetCurrentUser()
}

// GetSettings 返回设置项列表
func (s *ProfileService) GetSettings() ([]domain.SettingItem, error) {
	return s.repo.ListSettings()
}
