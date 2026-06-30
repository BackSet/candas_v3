import type {
  ActualizarDestinoDespachoRapidoPayload,
  ActualizarPresintoSacaPayload,
  AgregarPaqueteRapidoPayload,
  CrearDespachoRapidoPayload,
  CrearSacaRapidaPayload,
  DespachoRapido,
  EstadoDespachoRapido,
  FinalizarDespachoRapidoPayload,
  MoverPaqueteRapidoPayload,
} from '@/types/despacho-rapido'
import { handleResponse, openapiClient } from './openapi-client'

const BASE = '/api/v1/despachos-rapidos'

// Los endpoints de despachos rápidos no están en el schema generado; se invocan con el
// cliente openapi-fetch como rutas crudas (mismo patrón que ensacado.service.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = openapiClient as any

export const despachoRapidoService = {
  listar(estado?: EstadoDespachoRapido): Promise<DespachoRapido[]> {
    const query = estado ? `?estado=${encodeURIComponent(estado)}` : ''
    return handleResponse(client.GET(`${BASE}${query}`))
  },

  obtener(idDespacho: number): Promise<DespachoRapido> {
    return handleResponse(client.GET(`${BASE}/${idDespacho}`))
  },

  crear(payload: CrearDespachoRapidoPayload): Promise<DespachoRapido> {
    return handleResponse(client.POST(BASE, { body: payload }))
  },

  agregarPaquete(idDespacho: number, payload: AgregarPaqueteRapidoPayload): Promise<DespachoRapido> {
    return handleResponse(client.POST(`${BASE}/${idDespacho}/paquetes`, { body: payload }))
  },

  moverPaquete(idDespacho: number, payload: MoverPaqueteRapidoPayload): Promise<DespachoRapido> {
    return handleResponse(client.POST(`${BASE}/${idDespacho}/paquetes/mover`, { body: payload }))
  },

  crearSaca(idDespacho: number, payload?: CrearSacaRapidaPayload): Promise<DespachoRapido> {
    return handleResponse(client.POST(`${BASE}/${idDespacho}/sacas`, { body: payload ?? {} }))
  },

  actualizarPresinto(
    idDespacho: number,
    idSaca: number,
    payload: ActualizarPresintoSacaPayload
  ): Promise<DespachoRapido> {
    return handleResponse(client.PUT(`${BASE}/${idDespacho}/sacas/${idSaca}/presinto`, { body: payload }))
  },

  actualizarDestino(
    idDespacho: number,
    payload: ActualizarDestinoDespachoRapidoPayload
  ): Promise<DespachoRapido> {
    return handleResponse(client.PUT(`${BASE}/${idDespacho}/destino`, { body: payload }))
  },

  marcarListoParaGuia(idDespacho: number): Promise<DespachoRapido> {
    return handleResponse(client.POST(`${BASE}/${idDespacho}/listo-para-guia`, {}))
  },

  finalizar(idDespacho: number, payload: FinalizarDespachoRapidoPayload): Promise<DespachoRapido> {
    return handleResponse(client.POST(`${BASE}/${idDespacho}/finalizar`, { body: payload }))
  },
}
