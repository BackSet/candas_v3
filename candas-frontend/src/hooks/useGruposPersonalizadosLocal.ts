import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface GrupoPersonalizadoLocal {
  id: string
  nombre: string
  descripcion?: string
  idPaquetes: number[]
  provincia: string
  canton: string
}

interface GruposPorProvinciaCanton {
  [provincia: string]: {
    [canton: string]: {
      [grupoId: string]: GrupoPersonalizadoLocal
    }
  }
}

interface GruposPorLote {
  [loteRecepcionId: number]: GruposPorProvinciaCanton
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
      Object.keys(gruposLote).forEach(provincia => {
        Object.keys(gruposLote[provincia]).forEach(canton => {
          Object.values(gruposLote[provincia][canton]).forEach(grupo => {
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
      Object.keys(gruposLote).forEach(provincia => {
        Object.keys(gruposLote[provincia]).forEach(canton => {
          Object.values(gruposLote[provincia][canton]).forEach(grupo => {
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
  const guardarGrupos = useCallback((nuevosGrupos: GruposPorProvinciaCanton) => {
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
  const obtenerEstructura = useCallback((): GruposPorProvinciaCanton => {
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
    if (!estructura[grupo.provincia]) {
      estructura[grupo.provincia] = {}
    }
    if (!estructura[grupo.provincia][grupo.canton]) {
      estructura[grupo.provincia][grupo.canton] = {}
    }

    // Generar ID único
    const id = `grupo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const nuevoGrupo: GrupoPersonalizadoLocal = {
      ...grupo,
      id,
    }

    estructura[grupo.provincia][grupo.canton][id] = nuevoGrupo
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
    Object.keys(estructura).forEach(provincia => {
      Object.keys(estructura[provincia]).forEach(canton => {
        if (estructura[provincia][canton][id]) {
          delete estructura[provincia][canton][id]
          encontrado = true
          
          // Limpiar estructura vacía
          if (Object.keys(estructura[provincia][canton]).length === 0) {
            delete estructura[provincia][canton]
          }
          if (Object.keys(estructura[provincia]).length === 0) {
            delete estructura[provincia]
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

  // Obtener grupos por provincia y cantón
  const obtenerGruposPorProvinciaCanton = useCallback((provincia: string, canton: string): GrupoPersonalizadoLocal[] => {
    const estructura = obtenerEstructura()
    return Object.values(estructura[provincia]?.[canton] || {})
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
    let provinciaGrupo = ''
    let cantonGrupo = ''

    for (const provincia of Object.keys(estructura)) {
      for (const canton of Object.keys(estructura[provincia])) {
        const grupo = estructura[provincia][canton][grupoId]
        if (grupo) {
          grupoEncontrado = grupo
          provinciaGrupo = provincia
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
    estructura[provinciaGrupo][cantonGrupo][grupoId] = grupoEncontrado
    
    guardarGrupos(estructura)
    refrescarGrupos()
    toast.success(`${nuevosIds.length} paquete(s) agregado(s) al grupo`)
  }, [loteRecepcionId, obtenerEstructura, guardarGrupos, refrescarGrupos])

  // Mover un paquete de un grupo a otro
  const moverPaqueteAGrupo = useCallback((paqueteId: number, grupoIdDestino: string, provincia: string, canton: string) => {
    if (!loteRecepcionId) {
      toast.error('No se puede mover paquete sin lote de recepción')
      return
    }

    const estructura = obtenerEstructura()
    
    // Buscar y remover el paquete de su grupo actual
    let grupoOrigenEncontrado = false
    Object.keys(estructura).forEach(provinciaKey => {
      Object.keys(estructura[provinciaKey]).forEach(cantonKey => {
        Object.keys(estructura[provinciaKey][cantonKey]).forEach(grupoId => {
          const grupo = estructura[provinciaKey][cantonKey][grupoId]
          const index = grupo.idPaquetes.indexOf(paqueteId)
          if (index !== -1) {
            grupo.idPaquetes = grupo.idPaquetes.filter(id => id !== paqueteId)
            grupoOrigenEncontrado = true
            
            // Limpiar grupo vacío
            if (grupo.idPaquetes.length === 0) {
              delete estructura[provinciaKey][cantonKey][grupoId]
              if (Object.keys(estructura[provinciaKey][cantonKey]).length === 0) {
                delete estructura[provinciaKey][cantonKey]
              }
              if (Object.keys(estructura[provinciaKey]).length === 0) {
                delete estructura[provinciaKey]
              }
            }
          }
        })
      })
    })

    // Inicializar estructura si no existe
    if (!estructura[provincia]) {
      estructura[provincia] = {}
    }
    if (!estructura[provincia][canton]) {
      estructura[provincia][canton] = {}
    }

    // Buscar grupo destino
    const grupoDestino = estructura[provincia][canton][grupoIdDestino]
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
    obtenerGruposPorProvinciaCanton,
    obtenerEstructura,
    refrescarGrupos,
    agregarPaquetesAGrupo,
    moverPaqueteAGrupo,
  }
}
