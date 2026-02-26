import type { ClienteEnvioDirecto } from './cliente-envio-directo'

export interface EnvioDirecto {
  idEnvioDirecto?: number
  idDespacho?: number
  clienteEnvioDirecto?: ClienteEnvioDirecto
}
