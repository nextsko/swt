export interface Contact {
  id: string
  name: string
  avatarUrl: string
  wildFireId: string
  isSpecial: boolean
  specialKey?: string
}

export interface DiscoverFeature {
  key: string
  title: string
  icon: string
  iconColor: string
  description?: string
}

export interface SettingItem {
  key: string
  title: string
  icon: string
  iconColor: string
}
