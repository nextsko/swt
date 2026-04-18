import * as ProfileBinding from '../../bindings/changeme/backend/services/profileservice.js'
import type { SettingItem, User } from '../types'
import { mockSettings, mockUser, shouldUseMock } from './mockFallback'

export const profileService = {
    async getCurrentUser(): Promise<User | null> {
        if (shouldUseMock()) return mockUser
        const result = await ProfileBinding.GetCurrentUser()
        return (result ?? null) as unknown as User | null
    },

    async getSettings(): Promise<SettingItem[]> {
        if (shouldUseMock()) return mockSettings
        const result = await ProfileBinding.GetSettings()
        return (result ?? []) as unknown as SettingItem[]
    },
}
