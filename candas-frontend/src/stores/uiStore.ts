import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

const resolveTheme = (theme: ThemeMode): ResolvedTheme => {
  if (theme === 'system') return getSystemTheme()
  return theme
}

const applyThemeClass = (resolvedTheme: ResolvedTheme) => {
  if (typeof document === 'undefined') return
  if (resolvedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

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
        set((state) => {
          return { sidebarCollapsed: !state.sidebarCollapsed }
        })
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
      toggleTheme: () => set((state) => {
        const nextTheme: ThemeMode =
          state.theme === 'light' ? 'dark'
            : state.theme === 'dark' ? 'system'
              : 'light'
        const resolvedTheme = resolveTheme(nextTheme)
        applyThemeClass(resolvedTheme)
        return { theme: nextTheme, resolvedTheme }
      }),

      // Command Palette State
      isCommandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
      toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
    }),
    {
      name: 'candas-ui-storage',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed, theme: state.theme }), // Don't persist command palette/resolved theme state
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const resolvedTheme = resolveTheme(state.theme)
        state.setResolvedTheme(resolvedTheme)
      },
    }
  )
)
