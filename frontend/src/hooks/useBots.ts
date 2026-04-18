import { useCallback, useEffect, useState } from 'react'
import { botService } from '../services'
import type { Bot, Conversation } from '../types'

/**
 * useBots: 获取全部机器人 + 已安装清单，提供 install/uninstall 操作。
 */
export function useBots() {
    const [bots, setBots] = useState<Bot[]>([])
    const [loading, setLoading] = useState(true)

    const refresh = useCallback(async () => {
        setLoading(true)
        try {
            const list = await botService.listBots()
            setBots(list)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    const install = useCallback(
        async (id: string): Promise<Conversation | null> => {
            const conv = await botService.install(id)
            setBots((prev) =>
                prev.map((b) => (b.id === id ? { ...b, installed: true } : b)),
            )
            return conv
        },
        [],
    )

    const uninstall = useCallback(async (id: string) => {
        await botService.uninstall(id)
        setBots((prev) =>
            prev.map((b) => (b.id === id ? { ...b, installed: false } : b)),
        )
    }, [])

    return { bots, installed: bots.filter((b) => b.installed), loading, refresh, install, uninstall }
}
