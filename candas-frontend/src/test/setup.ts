import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'

// Limpieza automática tras cada test
afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})
