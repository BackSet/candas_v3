import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FormDraft {
  data: Record<string, unknown>
  savedAt: number
}

interface DraftStore {
  drafts: Record<string, FormDraft>
  saveDraft: (key: string, data: Record<string, unknown>) => void
  getDraft: (key: string) => FormDraft | undefined
  clearDraft: (key: string) => void
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      drafts: {},

      saveDraft: (key, data) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [key]: { data, savedAt: Date.now() },
          },
        }))
      },

      getDraft: (key) => get().drafts[key],

      clearDraft: (key) => {
        set((state) => {
          const next = { ...state.drafts }
          delete next[key]
          return { drafts: next }
        })
      },
    }),
    { name: 'candas-form-drafts' }
  )
)
