import * as DiscoverBinding from '../../bindings/changeme/backend/services/discoverservice.js'
import type { DiscoverFeature } from '../types'
import { mockFeatures, shouldUseMock } from './mockFallback'

export const discoverService = {
    async getFeatures(): Promise<DiscoverFeature[]> {
        if (shouldUseMock()) return mockFeatures
        const result = await DiscoverBinding.GetFeatures()
        return (result ?? []) as unknown as DiscoverFeature[]
    },
}
