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
  clearAllDrafts: () => void
}

const MAX_DRAFTS = 20
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000

function pruneDrafts(
  state: Pick<DraftStore, 'drafts'>
): Pick<DraftStore, 'drafts'> {
  const now = Date.now()
  const valid: Record<string, FormDraft> = {}
  const entries = Object.entries(state.drafts)
    .filter(([_, draft]) => now - draft.savedAt < DRAFT_EXPIRY_MS)
    .sort((a, b) => b[1].savedAt - a[1].savedAt)
    .slice(0, MAX_DRAFTS)
  for (const [key, draft] of entries) {
    valid[key] = draft
  }
  return { drafts: valid }
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      drafts: {},

      saveDraft: (key, data) => {
        set((state) => {
          const newDrafts = {
            ...state.drafts,
            [key]: { data, savedAt: Date.now() },
          }
          const now = Date.now()
          const valid = Object.entries(newDrafts)
            .filter(([_, draft]) => now - draft.savedAt < DRAFT_EXPIRY_MS)
            .sort((a, b) => b[1].savedAt - a[1].savedAt)
            .slice(0, MAX_DRAFTS)
          const pruned: Record<string, FormDraft> = {}
          for (const [k, v] of valid) {
            pruned[k] = v
          }
          return { drafts: pruned }
        })
      },

      getDraft: (key) => {
        const draft = get().drafts[key]
        if (draft && Date.now() - draft.savedAt >= DRAFT_EXPIRY_MS) {
          get().clearDraft(key)
          return undefined
        }
        return draft
      },

      clearDraft: (key) => {
        set((state) => {
          const next = { ...state.drafts }
          delete next[key]
          return { drafts: next }
        })
      },

      clearAllDrafts: () => {
        set({ drafts: {} })
      },
    }),
    {
      name: 'candas-form-drafts',
      partialize: (state) => pruneDrafts(state),
    }
  )
)
