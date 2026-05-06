import { describe, it, expect } from 'vitest'
import {
  mockConversations,
  mockMessages,
  mockUser,
  mockContacts,
  mockSpecialContacts,
  mockFeatures,
  mockSettings,
  isWailsRuntime,
  shouldUseMock,
} from './mockFallback'

describe('mock seed data', () => {
  it('should have non-empty conversations', () => {
    expect(mockConversations.length).toBeGreaterThan(0)
  })

  it('should have messages for each conversation', () => {
    for (const conv of mockConversations) {
      expect(mockMessages[conv.id]).toBeDefined()
      expect(mockMessages[conv.id].length).toBeGreaterThan(0)
    }
  })

  it('should have a current user with ID', () => {
    expect(mockUser.id).toBeTruthy()
    expect(mockUser.name).toBeTruthy()
  })

  it('should have contacts', () => {
    expect(mockContacts.length).toBeGreaterThan(0)
    expect(mockSpecialContacts.length).toBeGreaterThan(0)
  })

  it('should have features and settings', () => {
    expect(mockFeatures.length).toBeGreaterThan(0)
    expect(mockSettings.length).toBeGreaterThan(0)
  })
})

describe('mock environment detection', () => {
  it('isWailsRuntime should return false in test env', () => {
    expect(isWailsRuntime()).toBe(false)
  })

  it('shouldUseMock should return true in non-Wails env', () => {
    expect(shouldUseMock()).toBe(true)
  })
})
