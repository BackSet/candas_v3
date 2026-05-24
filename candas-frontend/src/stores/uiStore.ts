import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  applyThemeClass,
  getSystemTheme,
  resolveTheme,
  UI_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeMode,
} from '@/lib/theme'

export type { ResolvedTheme, ThemeMode }

interface UIState {
  sidebarCollapsed: boolean
  theme: ThemeMode
  resolvedTheme: ResolvedTheme
  toggleSidebar: () => void
  setTheme: (theme: ThemeMode) => void
  setResolvedTheme: (theme: ResolvedTheme) => void
  toggleTheme: () => void
  isCommandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: 'system',
      resolvedTheme: resolveTheme('system'),
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },
      setTheme: (theme) => {
        const resolvedTheme = resolveTheme(theme)
        set({ theme, resolvedTheme })
        applyThemeClass(resolvedTheme)
      },
      setResolvedTheme: (resolvedTheme) => {
        if (get().resolvedTheme === resolvedTheme) return
        set({ resolvedTheme })
        if (get().theme === 'system') {
          applyThemeClass(resolvedTheme)
        }
      },
      toggleTheme: () =>
        set((state) => {
          const nextTheme: ThemeMode =
            state.theme === 'light' ? 'dark' : state.theme === 'dark' ? 'system' : 'light'
          const resolvedTheme = resolveTheme(nextTheme)
          applyThemeClass(resolvedTheme)
          return { theme: nextTheme, resolvedTheme }
        }),

      isCommandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
      toggleCommandPalette: () =>
        set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
    }),
    {
      name: UI_STORAGE_KEY,
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = resolveTheme(state.theme)
          state.resolvedTheme = resolved
          applyThemeClass(resolved)
        }
      },
    }
  )
)
