export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const UI_STORAGE_KEY = 'candas-ui-storage'

export function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function resolveTheme(theme: ThemeMode): ResolvedTheme {
  if (theme === 'system') return getSystemTheme()
  return theme
}

export function applyThemeClass(resolvedTheme: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
}

/** Lee tema persistido antes del primer paint (anti-FOUC). */
export function getPersistedResolvedTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY)
    if (!raw) return getSystemTheme()
    const parsed = JSON.parse(raw) as { state?: { theme?: ThemeMode } }
    const theme = parsed?.state?.theme ?? 'system'
    return resolveTheme(theme)
  } catch {
    return getSystemTheme()
  }
}
