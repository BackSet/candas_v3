import { useEffect, useState } from 'react'

/**
 * Suscribe a una media query y devuelve si coincide actualmente.
 * SSR-safe: devuelve `false` cuando no hay `window`.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** Verdadero en pantallas grandes (>= 1024px, breakpoint `lg` de Tailwind). */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
