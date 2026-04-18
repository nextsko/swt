package services

import (
	"changeme/backend/domain"
	"changeme/backend/repository"
)

// DiscoverService 提供发现 Tab 的功能列表
type DiscoverService struct {
	repo repository.DiscoverRepository
}

func NewDiscoverService(r repository.DiscoverRepository) *DiscoverService {
	return &DiscoverService{repo: r}
}

// GetFeatures 返回发现 Tab 的功能项
func (s *DiscoverService) GetFeatures() ([]domain.DiscoverFeature, error) {
	return s.repo.ListFeatures()
}
