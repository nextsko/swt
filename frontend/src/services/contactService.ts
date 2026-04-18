import * as ContactBinding from '../../bindings/changeme/backend/services/contactservice.js'
import type { Contact } from '../types'
import {
    mockContacts,
    mockSpecialContacts,
    shouldUseMock,
} from './mockFallback'

export const contactService = {
    async getSpecialContacts(): Promise<Contact[]> {
        if (shouldUseMock()) return mockSpecialContacts
        const result = await ContactBinding.GetSpecialContacts()
        return (result ?? []) as unknown as Contact[]
    },

    async getContacts(): Promise<Contact[]> {
        if (shouldUseMock()) return mockContacts
        const result = await ContactBinding.GetContacts()
        return (result ?? []) as unknown as Contact[]
    },

    async getContact(id: string): Promise<Contact | null> {
        if (shouldUseMock())
            return mockContacts.find((c) => c.id === id) ?? null
        const result = await ContactBinding.GetContact(id)
        return (result ?? null) as unknown as Contact | null
    },
}
