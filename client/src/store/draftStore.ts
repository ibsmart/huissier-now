import { create } from 'zustand'
import type { InterventionDraft } from '../types'

interface DraftStore {
  draft: InterventionDraft
  setType: (type: InterventionDraft['type']) => void
  setDescription: (description: string) => void
  setLocation: (lat: number, lng: number, address: string) => void
  reset: () => void
}

export const useDraftStore = create<DraftStore>((set) => ({
  draft: {},
  setType: (type) => set((s) => ({ draft: { ...s.draft, type } })),
  setDescription: (description) => set((s) => ({ draft: { ...s.draft, description } })),
  setLocation: (lat, lng, address) =>
    set((s) => ({ draft: { ...s.draft, lat, lng, address } })),
  reset: () => set({ draft: {} }),
}))
