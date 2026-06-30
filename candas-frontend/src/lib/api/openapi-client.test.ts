import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { publicClient, authClient, unwrap, ensureOk, defaultQuerySerializer } from './openapi-client'
import { useAuthStore } from '@/stores/authStore'
import { ApiFetchError } from './errors'

describe('openapi-client', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    // Reemplazar globalThis.fetch por un mock
    globalThis.fetch = mockFetch
    // Resetear el estado de authStore
    useAuthStore.getState().logout()
    // Mockear window.location
    vi.stubGlobal('location', {
      pathname: '/',
      href: '',
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
  })

  describe('publicClient', () => {
    it('no debería inyectar cabeceras de sesión incluso si hay token', async () => {
      // Configurar token en el store
      useAuthStore.setState({
        token: 'test-token-jwt',
        user: { idUsuario: 1, username: 'test' } as any,
      })

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )

      await publicClient.GET('/api/v1/usuarios', { params: {} as any })

      expect(mockFetch).toHaveBeenCalled()
      const [request] = mockFetch.mock.calls[0]
      expect(request.headers.has('Authorization')).toBe(false)
      expect(request.headers.has('X-Agencia-Origen-Activa-Id')).toBe(false)
    })
  })

  describe('authClient', () => {
    it('debería inyectar la cabecera Authorization cuando hay token', async () => {
      // Configurar token en el store
      useAuthStore.setState({
        token: 'test-token-jwt',
        user: { idUsuario: 1, username: 'test' } as any,
      })

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )

      await authClient.GET('/api/v1/usuarios', { params: {} as any })

      expect(mockFetch).toHaveBeenCalled()
      const [request] = mockFetch.mock.calls[0]
      expect(request.headers.get('Authorization')).toBe('Bearer test-token-jwt')
    })

    it('debería inyectar la cabecera X-Agencia-Origen-Activa-Id cuando hay agencia activa', async () => {
      // Configurar agencia activa en el store
      useAuthStore.setState({
        activeAgencyId: 42,
      })

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )

      await authClient.GET('/api/v1/usuarios', { params: {} as any })

      expect(mockFetch).toHaveBeenCalled()
      const [request] = mockFetch.mock.calls[0]
      expect(request.headers.get('X-Agencia-Origen-Activa-Id')).toBe('42')
    })
  })

  describe('onResponse middleware (401 Unauthorized)', () => {
    it('debería ejecutar logout y redirigir a /login ante un error 401', async () => {
      // Establecer sesión inicial
      useAuthStore.setState({
        token: 'expired-token',
        user: { idUsuario: 1, username: 'test' } as any,
      })

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      )

      await authClient.GET('/api/v1/usuarios', { params: {} as any })

      // Verificar que se limpió el store
      expect(useAuthStore.getState().token).toBeNull()
      expect(useAuthStore.getState().user).toBeNull()

      // Verificar redirección
      expect(window.location.href).toBe('/login')
    })
  })

  describe('defaultQuerySerializer', () => {
    it('debería aplanar objetos de consulta como pageable', () => {
      const query = {
        search: 'juan',
        pageable: {
          page: 2,
          size: 10,
          sort: ['nombre,asc'],
        },
      }
      const serialized = defaultQuerySerializer(query)
      expect(serialized).toContain('search=juan')
      expect(serialized).toContain('page=2')
      expect(serialized).toContain('size=10')
      expect(serialized).toContain('sort=nombre%2Casc')
    })
  })

  describe('helpers (unwrap y ensureOk)', () => {
    it('unwrap debería resolver los datos cuando la respuesta es exitosa', async () => {
      const mockResult = {
        data: { idUsuario: 1, nombreCompleto: 'Usuario Test' },
        error: undefined,
        response: new Response(JSON.stringify({ idUsuario: 1, nombreCompleto: 'Usuario Test' }), { status: 200 }),
      }

      const data = await unwrap(Promise.resolve(mockResult))
      expect(data).toEqual({ idUsuario: 1, nombreCompleto: 'Usuario Test' })
    })

    it('ensureOk debería lanzar un ApiFetchError con detalles cuando la respuesta falla', async () => {
      const response = new Response(
        JSON.stringify({
          message: 'Error de validación',
        }),
        { status: 400, statusText: 'Bad Request' }
      )

      expect(() => ensureOk(response, { message: 'Error de validación' })).toThrow(ApiFetchError)
    })
  })
})
