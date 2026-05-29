import { create } from 'zustand'
import type { InterventionDraft } from '../types'

interface DraftStore {
  draft: InterventionDraft
  setType: (type: InterventionDraft['type']) => void
  setSubType: (subType: string) => void
  setDescription: (description: string) => void
  setPhotos: (photos: string[]) => void
  setAudio: (audioBase64: string | undefined) => void
  setLocation: (lat: number, lng: number, address: string) => void
  reset: () => void
}

export const useDraftStore = create<DraftStore>((set) => ({
  draft: {},
  setType: (type) => set((s) => ({ draft: { ...s.draft, type, subType: undefined } })),
  setSubType: (subType) => set((s) => ({ draft: { ...s.draft, subType } })),
  setDescription: (description) => set((s) => ({ draft: { ...s.draft, description } })),
  setPhotos: (photos) => set((s) => ({ draft: { ...s.draft, photos } })),
  setAudio: (audioBase64) => set((s) => ({ draft: { ...s.draft, audioBase64 } })),
  setLocation: (lat, lng, address) =>
    set((s) => ({ draft: { ...s.draft, lat, lng, address } })),
  reset: () => set({ draft: {} }),
}))
