import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface GrupoPersonalizadoLocal {
  id: string
  nombre: string
  descripcion?: string
  idPaquetes: number[]
  ciudad: string
  canton: string
}

interface GruposPorCiudadCanton {
  [ciudad: string]: {
    [canton: string]: {
      [grupoId: string]: GrupoPersonalizadoLocal
    }
  }
}

interface GruposPorLote {
  [loteRecepcionId: number]: GruposPorCiudadCanton
}

const STORAGE_KEY = 'grupos-personalizados-local'

export function useGruposPersonalizadosLocal(loteRecepcionId?: number) {
  const [grupos, setGrupos] = useState<GrupoPersonalizadoLocal[]>([])

  // Cargar grupos desde localStorage
  useEffect(() => {
    if (!loteRecepcionId) {
      setGrupos([])
      return
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        setGrupos([])
        return
      }

      const data: GruposPorLote = JSON.parse(stored)
      const gruposLote = data[loteRecepcionId]
      
      if (!gruposLote) {
        setGrupos([])
        return
      }

      // Convertir estructura anidada a array plano
      const gruposArray: GrupoPersonalizadoLocal[] = []
      Object.keys(gruposLote).forEach(ciudad => {
        Object.keys(gruposLote[ciudad]).forEach(canton => {
          Object.values(gruposLote[ciudad][canton]).forEach(grupo => {
            gruposArray.push(grupo)
          })
        })
      })

      setGrupos(gruposArray)
    } catch (error) {
      console.error('Error al cargar grupos personalizados:', error)
      setGrupos([])
    }
  }, [loteRecepcionId])

  // Función para refrescar grupos (útil después de crear/eliminar)
  const refrescarGrupos = useCallback(() => {
    if (!loteRecepcionId) {
      setGrupos([])
      return
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        setGrupos([])
        return
      }

      const data: GruposPorLote = JSON.parse(stored)
      const gruposLote = data[loteRecepcionId]
      
      if (!gruposLote) {
        setGrupos([])
        return
      }

      const gruposArray: GrupoPersonalizadoLocal[] = []
      Object.keys(gruposLote).forEach(ciudad => {
        Object.keys(gruposLote[ciudad]).forEach(canton => {
          Object.values(gruposLote[ciudad][canton]).forEach(grupo => {
            gruposArray.push(grupo)
          })
        })
      })

      setGrupos(gruposArray)
    } catch (error) {
      console.error('Error al refrescar grupos personalizados:', error)
      setGrupos([])
    }
  }, [loteRecepcionId])

  // Guardar grupos en localStorage
  const guardarGrupos = useCallback((nuevosGrupos: GruposPorCiudadCanton) => {
    if (!loteRecepcionId) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const data: GruposPorLote = stored ? JSON.parse(stored) : {}
      data[loteRecepcionId] = nuevosGrupos
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error al guardar grupos personalizados:', error)
      toast.error('Error al guardar el grupo')
    }
  }, [loteRecepcionId])

  // Obtener estructura completa de grupos
  const obtenerEstructura = useCallback((): GruposPorCiudadCanton => {
    if (!loteRecepcionId) return {}

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return {}

      const data: GruposPorLote = JSON.parse(stored)
      return data[loteRecepcionId] || {}
    } catch (error) {
      console.error('Error al obtener estructura de grupos:', error)
      return {}
    }
  }, [loteRecepcionId])

  // Crear grupo
  const crearGrupo = useCallback((grupo: Omit<GrupoPersonalizadoLocal, 'id'>) => {
    if (!loteRecepcionId) {
      toast.error('No se puede crear grupo sin lote de recepción')
      return
    }

    const estructura = obtenerEstructura()
    
    // Inicializar estructura si no existe
    if (!estructura[grupo.ciudad]) {
      estructura[grupo.ciudad] = {}
    }
    if (!estructura[grupo.ciudad][grupo.canton]) {
      estructura[grupo.ciudad][grupo.canton] = {}
    }

    // Generar ID único
    const id = `grupo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const nuevoGrupo: GrupoPersonalizadoLocal = {
      ...grupo,
      id,
    }

    estructura[grupo.ciudad][grupo.canton][id] = nuevoGrupo
    guardarGrupos(estructura)

    // Refrescar grupos
    refrescarGrupos()
    
    toast.success('Grupo creado exitosamente')
    return nuevoGrupo
  }, [loteRecepcionId, obtenerEstructura, guardarGrupos])

  // Eliminar grupo
  const eliminarGrupo = useCallback((id: string) => {
    if (!loteRecepcionId) {
      toast.error('No se puede eliminar grupo sin lote de recepción')
      return
    }

    const estructura = obtenerEstructura()
    
    // Buscar y eliminar el grupo
    let encontrado = false
    Object.keys(estructura).forEach(ciudad => {
      Object.keys(estructura[ciudad]).forEach(canton => {
        if (estructura[ciudad][canton][id]) {
          delete estructura[ciudad][canton][id]
          encontrado = true
          
          // Limpiar estructura vacía
          if (Object.keys(estructura[ciudad][canton]).length === 0) {
            delete estructura[ciudad][canton]
          }
          if (Object.keys(estructura[ciudad]).length === 0) {
            delete estructura[ciudad]
          }
        }
      })
    })

    if (encontrado) {
      guardarGrupos(estructura)
      refrescarGrupos()
      toast.success('Grupo eliminado exitosamente')
    } else {
      toast.error('Grupo no encontrado')
    }
  }, [loteRecepcionId, obtenerEstructura, guardarGrupos])

  // Obtener grupos por ciudad y cantón
  const obtenerGruposPorCiudadCanton = useCallback((ciudad: string, canton: string): GrupoPersonalizadoLocal[] => {
    const estructura = obtenerEstructura()
    return Object.values(estructura[ciudad]?.[canton] || {})
  }, [obtenerEstructura])

  // Agregar paquetes a un grupo existente
  const agregarPaquetesAGrupo = useCallback((grupoId: string, idPaquetes: number[]) => {
    if (!loteRecepcionId) {
      toast.error('No se puede agregar paquetes sin lote de recepción')
      return
    }

    const estructura = obtenerEstructura()
    
    // Buscar el grupo
    let grupoEncontrado: GrupoPersonalizadoLocal | null = null
    let ciudadGrupo = ''
    let cantonGrupo = ''

    for (const ciudad of Object.keys(estructura)) {
      for (const canton of Object.keys(estructura[ciudad])) {
        const grupo = estructura[ciudad][canton][grupoId]
        if (grupo) {
          grupoEncontrado = grupo
          ciudadGrupo = ciudad
          cantonGrupo = canton
          break
        }
      }
      if (grupoEncontrado) break
    }

    if (!grupoEncontrado) {
      toast.error('Grupo no encontrado')
      return
    }

    // Agregar nuevos IDs sin duplicados
    const idsExistentes = new Set(grupoEncontrado.idPaquetes)
    const nuevosIds = idPaquetes.filter(id => !idsExistentes.has(id))
    
    if (nuevosIds.length === 0) {
      toast.info('Todos los paquetes ya están en el grupo')
      return
    }

    grupoEncontrado.idPaquetes = [...grupoEncontrado.idPaquetes, ...nuevosIds]
    estructura[ciudadGrupo][cantonGrupo][grupoId] = grupoEncontrado
    
    guardarGrupos(estructura)
    refrescarGrupos()
    toast.success(`${nuevosIds.length} paquete(s) agregado(s) al grupo`)
  }, [loteRecepcionId, obtenerEstructura, guardarGrupos, refrescarGrupos])

  // Mover un paquete de un grupo a otro
  const moverPaqueteAGrupo = useCallback((paqueteId: number, grupoIdDestino: string, ciudad: string, canton: string) => {
    if (!loteRecepcionId) {
      toast.error('No se puede mover paquete sin lote de recepción')
      return
    }

    const estructura = obtenerEstructura()
    
    // Buscar y remover el paquete de su grupo actual
    let grupoOrigenEncontrado = false
    Object.keys(estructura).forEach(ciudadKey => {
      Object.keys(estructura[ciudadKey]).forEach(cantonKey => {
        Object.keys(estructura[ciudadKey][cantonKey]).forEach(grupoId => {
          const grupo = estructura[ciudadKey][cantonKey][grupoId]
          const index = grupo.idPaquetes.indexOf(paqueteId)
          if (index !== -1) {
            grupo.idPaquetes = grupo.idPaquetes.filter(id => id !== paqueteId)
            grupoOrigenEncontrado = true
            
            // Limpiar grupo vacío
            if (grupo.idPaquetes.length === 0) {
              delete estructura[ciudadKey][cantonKey][grupoId]
              if (Object.keys(estructura[ciudadKey][cantonKey]).length === 0) {
                delete estructura[ciudadKey][cantonKey]
              }
              if (Object.keys(estructura[ciudadKey]).length === 0) {
                delete estructura[ciudadKey]
              }
            }
          }
        })
      })
    })

    // Inicializar estructura si no existe
    if (!estructura[ciudad]) {
      estructura[ciudad] = {}
    }
    if (!estructura[ciudad][canton]) {
      estructura[ciudad][canton] = {}
    }

    // Buscar grupo destino
    const grupoDestino = estructura[ciudad][canton][grupoIdDestino]
    if (!grupoDestino) {
      toast.error('Grupo destino no encontrado')
      return
    }

    // Agregar paquete al grupo destino (sin duplicados)
    if (!grupoDestino.idPaquetes.includes(paqueteId)) {
      grupoDestino.idPaquetes.push(paqueteId)
    }

    guardarGrupos(estructura)
    refrescarGrupos()
    toast.success('Paquete movido exitosamente')
  }, [loteRecepcionId, obtenerEstructura, guardarGrupos, refrescarGrupos])

  return {
    grupos,
    crearGrupo,
    eliminarGrupo,
    obtenerGruposPorCiudadCanton,
    obtenerEstructura,
    refrescarGrupos,
    agregarPaquetesAGrupo,
    moverPaqueteAGrupo,
  }
}
