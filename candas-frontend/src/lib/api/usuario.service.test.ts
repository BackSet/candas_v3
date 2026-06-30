import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usuarioService } from './usuario.service'

describe('usuario.service', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    globalThis.fetch = mockFetch
    mockFetch.mockReset()
  })

  it('debería obtener todos los usuarios con paginación y filtros', async () => {
    const mockResponseData = {
      content: [
        { idUsuario: 1, username: 'juan', email: 'juan@example.com', activo: true },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
    }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const result = await usuarioService.findAll({
      page: 0,
      size: 10,
      search: 'juan',
      activo: true,
    })

    expect(mockFetch).toHaveBeenCalled()
    const [request] = mockFetch.mock.calls[0]
    expect(request.url).toContain('/api/v1/usuarios')
    expect(request.url).toContain('page=0')
    expect(request.url).toContain('size=10')
    expect(request.url).toContain('search=juan')
    expect(request.url).toContain('activo=true')

    expect(result).toEqual(mockResponseData)
  })

  it('debería obtener un usuario por ID', async () => {
    const mockUser = { idUsuario: 42, username: 'maria', email: 'maria@example.com' }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockUser), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const result = await usuarioService.findById(42)

    expect(mockFetch).toHaveBeenCalled()
    const [request] = mockFetch.mock.calls[0]
    expect(request.url).toContain('/api/v1/usuarios/42')
    expect(result).toEqual(mockUser)
  })

  it('debería crear un nuevo usuario', async () => {
    const newUser = { username: 'pedro', email: 'pedro@example.com', nombreCompleto: 'Pedro Pérez' }
    const createdUser = { idUsuario: 3, ...newUser }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(createdUser), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const result = await usuarioService.create(newUser as any)

    expect(mockFetch).toHaveBeenCalled()
    const [request] = mockFetch.mock.calls[0]
    expect(request.url).toContain('/api/v1/usuarios')
    expect(request.method).toBe('POST')
    expect(await request.json()).toEqual(newUser)
    expect(result).toEqual(createdUser)
  })

  it('debería actualizar un usuario existente', async () => {
    const updateData = { idUsuario: 3, username: 'pedro-updated', email: 'pedro@example.com', nombreCompleto: 'Pedro Pérez' }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(updateData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const result = await usuarioService.update(3, updateData as any)

    expect(mockFetch).toHaveBeenCalled()
    const [request] = mockFetch.mock.calls[0]
    expect(request.url).toContain('/api/v1/usuarios/3')
    expect(request.method).toBe('PUT')
    expect(await request.json()).toEqual(updateData)
    expect(result).toEqual(updateData)
  })

  it('debería eliminar un usuario', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(null, {
        status: 204,
      })
    )

    await usuarioService.delete(3)

    expect(mockFetch).toHaveBeenCalled()
    const [request] = mockFetch.mock.calls[0]
    expect(request.url).toContain('/api/v1/usuarios/3')
    expect(request.method).toBe('DELETE')
  })
})
