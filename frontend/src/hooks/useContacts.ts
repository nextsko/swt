import { useEffect, useState } from 'react'
import { contactService } from '../services'
import type { Contact } from '../types'

export function useContacts() {
  const [special, setSpecial] = useState<Contact[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [sp, list] = await Promise.all([
          contactService.getSpecialContacts(),
          contactService.getContacts(),
        ])
        if (!cancelled) {
          setSpecial(sp)
          setContacts(list)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { special, contacts, loading }
}
