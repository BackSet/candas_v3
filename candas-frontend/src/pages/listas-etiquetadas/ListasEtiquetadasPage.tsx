import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import VistaOperario from '@/components/listas-etiquetadas/VistaOperario'
import CrearListaCard from '@/components/listas-etiquetadas/CrearListaCard'
import ListaGuiasPorEtiqueta from '@/components/listas-etiquetadas/ListaGuiasPorEtiqueta'
import EscanearGuiaCard from '@/components/listas-etiquetadas/EscanearGuiaCard'
import HistorialEtiquetasCard from '@/components/listas-etiquetadas/HistorialEtiquetasCard'
import GuiasEnVariasListasCard from '@/components/listas-etiquetadas/GuiasEnVariasListasCard'
import { useHasPermission } from '@/hooks/useHasRole'
import { PERMISSIONS } from '@/types/permissions'
import { Tag, Monitor, ScanLine, Plus, List, Clock, ListFilter } from 'lucide-react'
import { StandardPageLayout } from '@/app/layout/StandardPageLayout'

export default function ListasEtiquetadasPage() {
  const [vistaOperario, setVistaOperario] = useState(false)
  const hasPaquetesEditar = useHasPermission(PERMISSIONS.PAQUETES.EDITAR)
  const modoOperario = !hasPaquetesEditar

  if (vistaOperario) {
    return <VistaOperario onVolver={() => setVistaOperario(false)} />
  }

  return (
    <StandardPageLayout
      title="Etiquetado de Guías"
      icon={<Tag className="h-4 w-4" />}
      actions={
        <Button
          onClick={() => setVistaOperario(true)}
          variant="outline"
          size="sm"
          className="h-8 text-xs shadow-sm"
        >
          <Monitor className="h-3.5 w-3.5 mr-1.5" />
          Pantalla completa
        </Button>
      }
    >
      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs defaultValue="escanear" className="space-y-0 h-full flex flex-col">
          <div className="border-b border-border/40 px-1">
            <TabsList className="bg-transparent h-10 p-0 gap-0 justify-start w-auto inline-flex">
              <TabsTrigger
                value="escanear"
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 font-medium text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none hover:text-foreground min-w-[7rem] w-[7rem] justify-center"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider truncate">
                  <ScanLine className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Escanear</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="gestionar"
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 font-medium text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none hover:text-foreground min-w-[7rem] w-[7rem] justify-center"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider truncate">
                  <List className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Listas</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="historial"
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 font-medium text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none hover:text-foreground min-w-[7rem] w-[7rem] justify-center"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider truncate">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Historial</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="varias-listas"
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 font-medium text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none hover:text-foreground min-w-[7rem] w-[7rem] justify-center"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider truncate">
                  <ListFilter className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Guías en varias listas</span>
                </div>
              </TabsTrigger>
              {hasPaquetesEditar && (
                <TabsTrigger
                  value="crear"
                  className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 font-medium text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none hover:text-foreground min-w-[7rem] w-[7rem] justify-center"
                >
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider truncate">
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Crear Lista</span>
                  </div>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto py-6">
            <TabsContent value="escanear" className="mt-0 h-full p-1">
              <div className="max-w-5xl mx-auto w-full h-full">
                <EscanearGuiaCard />
              </div>
            </TabsContent>

            <TabsContent value="gestionar" className="mt-0 h-full p-1">
              <div className="max-w-5xl mx-auto w-full h-full">
                <ListaGuiasPorEtiqueta modoOperario={modoOperario} />
              </div>
            </TabsContent>

            <TabsContent value="historial" className="mt-0 h-full p-1">
              <div className="max-w-5xl mx-auto w-full h-full">
                <HistorialEtiquetasCard />
              </div>
            </TabsContent>

            <TabsContent value="varias-listas" className="mt-0 h-full p-1">
              <div className="max-w-5xl mx-auto w-full h-full">
                <GuiasEnVariasListasCard />
              </div>
            </TabsContent>

            {hasPaquetesEditar && (
              <TabsContent value="crear" className="mt-0 h-full p-1">
                <div className="max-w-5xl mx-auto w-full h-full">
                  <CrearListaCard />
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </StandardPageLayout>
  )
}
