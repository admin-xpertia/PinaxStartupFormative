'use client';

import { useEffect, useMemo, useState } from "react"
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { apiClient } from "@/lib/api-client"
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Edit,
  Plus,
  Download,
  FileJson,
  Sparkles,
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle,
  X,
  GripVertical,
} from "lucide-react"
import type { Fase, ProofPoint } from "@/types/fase"
import { cn } from "@/lib/utils"

export interface ProgramaData {
  id: string
  nombre: string
  descripcion: string
  fases: Fase[]
}

interface VisualRoadmapBuilderProps {
  programaId: string
  programa: ProgramaData
  onUpdate: (updatedPrograma: ProgramaData) => Promise<void>
  readonly?: boolean
}

type NodeType = "programa" | "fase" | "proofPoint"

interface NodePosition {
  x: number
  y: number
}

interface RoadmapNode {
  id: string
  type: NodeType
  position: NodePosition
  data: any
}

interface RoadmapEdge {
  id: string
  source: string
  target: string
  type: "normal" | "prerequisite"
}

const NODE_PREFIX: Record<NodeType, string> = {
  programa: "programa",
  fase: "fase",
  proofPoint: "pp",
}

const buildNodeId = (type: NodeType, id: string) => `${NODE_PREFIX[type]}-${id}`
const extractEntityId = (compositeId: string | null, type: NodeType) =>
  compositeId?.replace(`${NODE_PREFIX[type]}-`, "") ?? null

export function VisualRoadmapBuilder({ programaId, programa, onUpdate, readonly = false }: VisualRoadmapBuilderProps) {
  const [editionMode, setEditionMode] = useState(!readonly)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [localPrograma, setLocalPrograma] = useState<ProgramaData>(programa)

  useEffect(() => {
    setLocalPrograma(programa)
  }, [programa])

  useEffect(() => {
    setEditionMode(!readonly)
  }, [readonly])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const selectedFaseId = selectedNodeType === "fase" ? extractEntityId(selectedNodeId, "fase") : null
  const selectedProofPointId =
    selectedNodeType === "proofPoint" ? extractEntityId(selectedNodeId, "proofPoint") : null

  const allProofPoints = useMemo(
    () => localPrograma.fases.flatMap((fase) => fase.proof_points),
    [localPrograma.fases],
  )

  const selectedFase = selectedFaseId ? localPrograma.fases.find((fase) => fase.id === selectedFaseId) : null
  const selectedProofPoint = selectedProofPointId
    ? allProofPoints.find((pp) => pp.id === selectedProofPointId)
    : null

  useEffect(() => {
    if (selectedNodeType === "fase" && selectedFaseId && !selectedFase) {
      setSelectedNodeId(null)
      setSelectedNodeType(null)
    }
    if (selectedNodeType === "proofPoint" && selectedProofPointId && !selectedProofPoint) {
      setSelectedNodeId(null)
      setSelectedNodeType(null)
    }
  }, [selectedNodeType, selectedFaseId, selectedFase, selectedProofPointId, selectedProofPoint])

  const { nodes, edges } = useMemo(() => {
    const nodes: RoadmapNode[] = []
    const edges: RoadmapEdge[] = []

    const totalProofPoints = localPrograma.fases.reduce((acc, fase) => acc + fase.proof_points.length, 0)

    nodes.push({
      id: buildNodeId("programa", localPrograma.id),
      type: "programa",
      position: { x: 50, y: 300 },
      data: {
        nombre: localPrograma.nombre,
        fases_count: localPrograma.fases.length,
        pp_count: totalProofPoints,
      },
    })

    localPrograma.fases.forEach((fase, faseIdx) => {
      const faseNodeId = buildNodeId("fase", fase.id)

      nodes.push({
        id: faseNodeId,
        type: "fase",
        position: { x: 450 + faseIdx * 300, y: 100 },
        data: {
          numero: fase.numero,
          nombre: fase.nombre,
          proof_points_count: fase.proof_points.length,
          duracion_semanas: fase.duracion_semanas,
          documentacion_completa: fase.documentacion_completa,
          editable: editionMode,
        },
      })

      edges.push({
        id: `e-programa-${fase.id}`,
        source: buildNodeId("programa", localPrograma.id),
        target: faseNodeId,
        type: "normal",
      })

      fase.proof_points.forEach((pp, ppIdx) => {
        const ppNodeId = buildNodeId("proofPoint", pp.id)

        nodes.push({
          id: ppNodeId,
          type: "proofPoint",
          position: { x: 450 + faseIdx * 300, y: 300 + ppIdx * 150 },
          data: {
            nombre: pp.nombre,
            niveles_count: pp.numero_niveles,
            prerequisitos_count: pp.prerequisitos.length,
            contenido_listo: pp.niveles.some((n) => n.componentes.some((c) => c.contenido_listo)),
            editable: editionMode,
          },
        })

        edges.push({
          id: `e-fase-${pp.id}`,
          source: faseNodeId,
          target: ppNodeId,
          type: "normal",
        })

        pp.prerequisitos.forEach((prereqId) => {
          edges.push({
            id: `e-prereq-${pp.id}-${prereqId}`,
            source: buildNodeId("proofPoint", prereqId),
            target: ppNodeId,
            type: "prerequisite",
          })
        })
      })
    })

    return { nodes, edges }
  }, [localPrograma, editionMode])

  const getNodeCenter = (nodeId: string): NodePosition => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }

    let width = 300
    let height = 100

    if (node.type === "fase") {
      width = 250
      height = 120
    } else if (node.type === "proofPoint") {
      width = 220
      height = 100
    }

    return {
      x: node.position.x + width / 2,
      y: node.position.y + height / 2,
    }
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5))
  const handleFitView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const persistOrder = async (payload: { items: { id: string; orden: number }[]; programaId?: string; faseId?: string }) => {
    try {
      await apiClient.patch("/arquitectura/ordenar", payload)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "No se pudo actualizar el orden")
    }
  }

  const updatePrereqsRemote = async (proofPointId: string, prereqs: string[]) => {
    try {
      await apiClient.put(`/proofpoints/${proofPointId}/prerequisitos`, {
        prerequisitos: prereqs,
      })
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "No se pudieron actualizar los prerequisitos")
    }
  }

  const handlePhaseDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    let updatedPrograma: ProgramaData | null = null
    let orderedItems: { id: string; orden: number }[] | null = null

    setLocalPrograma((prev) => {
      const fases = prev.fases
      const oldIndex = fases.findIndex((fase) => fase.id === String(active.id))
      const newIndex = fases.findIndex((fase) => fase.id === String(over.id))

      if (oldIndex === -1 || newIndex === -1) {
        return prev
      }

      const reordered = arrayMove(fases, oldIndex, newIndex).map((fase, index) => ({
        ...fase,
        numero: index + 1,
      }))

      orderedItems = reordered.map((fase, index) => ({
        id: fase.id,
        orden: index + 1,
      }))

      updatedPrograma = { ...prev, fases: reordered }
      return updatedPrograma
    })

    if (!updatedPrograma || !orderedItems) return

    persistOrder({ items: orderedItems, programaId })
      .then(() => onUpdate(updatedPrograma!))
      .catch(async (error) => {
        console.error("Error al persistir nuevo orden de fases:", error)
        await onUpdate(programa)
      })
  }

  const handleProofPointDragEnd =
    (faseId: string) =>
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      let updatedPrograma: ProgramaData | null = null
      let orderedItems: { id: string; orden: number }[] | null = null

      setLocalPrograma((prev) => {
        const faseIndex = prev.fases.findIndex((fase) => fase.id === faseId)
        if (faseIndex === -1) {
          return prev
        }

        const proofPoints = prev.fases[faseIndex].proof_points
        const oldIndex = proofPoints.findIndex((pp) => pp.id === String(active.id))
        const newIndex = proofPoints.findIndex((pp) => pp.id === String(over.id))

        if (oldIndex === -1 || newIndex === -1) {
          return prev
        }

        const reorderedProofs = arrayMove(proofPoints, oldIndex, newIndex)
        orderedItems = reorderedProofs.map((pp, index) => ({
          id: pp.id,
          orden: index + 1,
        }))

        const updatedFases = prev.fases.map((fase, index) =>
          index === faseIndex
            ? {
                ...fase,
                proof_points: reorderedProofs,
              }
            : fase,
        )

        updatedPrograma = { ...prev, fases: updatedFases }
        return updatedPrograma
      })

      if (!updatedPrograma || !orderedItems) return

      persistOrder({ items: orderedItems, faseId })
        .then(() => onUpdate(updatedPrograma!))
        .catch(async (error) => {
          console.error("Error al persistir orden de proof points:", error)
          await onUpdate(programa)
        })
    }

  const handleUpdatePrereqs = async (proofPointId: string, newPrereqArray: string[]) => {
    let updatedPrograma: ProgramaData | null = null

    setLocalPrograma((prev) => {
      const updatedFases = prev.fases.map((fase) => ({
        ...fase,
        proof_points: fase.proof_points.map((pp) =>
          pp.id === proofPointId ? { ...pp, prerequisitos: newPrereqArray } : pp,
        ),
      }))

      updatedPrograma = { ...prev, fases: updatedFases }
      return updatedPrograma
    })

    if (!updatedPrograma) return

    try {
      await updatePrereqsRemote(proofPointId, newPrereqArray)
      await onUpdate(updatedPrograma)
    } catch (error) {
      console.error("Error al actualizar prerequisitos:", error)
      await onUpdate(programa)
    }
  }

  const handleAddFase = async () => {
    const nombre = window.prompt("Nombre de la nueva fase")
    if (!nombre || !nombre.trim()) return

    try {
      const response = await apiClient.post("/fases", {
        programaId,
        nombre: nombre.trim(),
      })

      const nuevaFase = response.data

      const sanitizedFase: Fase = {
        id: nuevaFase.id,
        nombre: nuevaFase.nombre ?? nombre.trim(),
        numero: nuevaFase.numero ?? localPrograma.fases.length + 1,
        descripcion: nuevaFase.descripcion ?? "",
        objetivos_aprendizaje: nuevaFase.objetivos_aprendizaje ?? [],
        duracion_semanas: nuevaFase.duracion_semanas ?? 0,
        numero_proof_points: nuevaFase.numero_proof_points ?? 0,
        documentacion_completa: nuevaFase.documentacion_completa ?? false,
        proof_points: nuevaFase.proof_points ?? [],
      }

      setLocalPrograma((prev) => {
        const updatedFases = [...prev.fases, sanitizedFase]
        const updatedPrograma = { ...prev, fases: updatedFases }
        void onUpdate(updatedPrograma)
        return updatedPrograma
      })

      setSelectedNodeId(buildNodeId("fase", sanitizedFase.id))
      setSelectedNodeType("fase")
    } catch (error) {
      console.error("Error al crear la fase:", error)
    }
  }

  const handleAddProofPoint = async (faseId: string) => {
    const nombre = window.prompt("Nombre del nuevo proof point")
    if (!nombre || !nombre.trim()) return

    const preguntaCentral = window.prompt("Pregunta central del proof point")
    if (preguntaCentral === null) return

    try {
      const response = await apiClient.post("/proofpoints", {
        faseId,
        nombre: nombre.trim(),
        pregunta_central: preguntaCentral.trim(),
      })

      const nuevoProofPoint = response.data

      const sanitizedProofPoint: ProofPoint = {
        id: nuevoProofPoint.id,
        nombre: nuevoProofPoint.nombre ?? nombre.trim(),
        slug: nuevoProofPoint.slug ?? nombre.trim().toLowerCase().replace(/\s+/g, "-"),
        descripcion: nuevoProofPoint.descripcion ?? "",
        pregunta_central: nuevoProofPoint.pregunta_central ?? preguntaCentral.trim(),
        tipo_entregable: nuevoProofPoint.tipo_entregable ?? "",
        numero_niveles: nuevoProofPoint.numero_niveles ?? 0,
        prerequisitos: nuevoProofPoint.prerequisitos ?? [],
        duracion_estimada_horas: nuevoProofPoint.duracion_estimada_horas ?? 0,
        niveles: nuevoProofPoint.niveles ?? [],
      }

      setLocalPrograma((prev) => {
        const updatedFases = prev.fases.map((fase) =>
          fase.id === faseId
            ? {
                ...fase,
                proof_points: [...fase.proof_points, sanitizedProofPoint],
                numero_proof_points: (fase.numero_proof_points ?? fase.proof_points.length) + 1,
              }
            : fase,
        )
        const updatedPrograma = { ...prev, fases: updatedFases }
        void onUpdate(updatedPrograma)
        return updatedPrograma
      })

      setSelectedNodeId(buildNodeId("proofPoint", sanitizedProofPoint.id))
      setSelectedNodeType("proofPoint")
    } catch (error) {
      console.error("Error al crear el proof point:", error)
    }
  }

  const availablePrereqOptions = useMemo(() => {
    if (!selectedProofPoint) return []
    return allProofPoints.filter((pp) => pp.id !== selectedProofPoint.id)
  }, [allProofPoints, selectedProofPoint])

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r pr-4">
              <Button size="sm" variant="outline" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleFitView}>
                <Maximize className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>

            <div className="flex items-center gap-2 border-r pr-4">
              <Button
                size="sm"
                variant={editionMode ? "default" : "outline"}
                onClick={() => setEditionMode(!editionMode)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modo Edición
              </Button>
              {editionMode && (
                <Button size="sm" variant="outline" onClick={handleAddFase}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Fase
                </Button>
              )}
            </div>

            <Button size="sm" variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Auto-organizar
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PNG
            </Button>
            <Button size="sm" variant="outline">
              <FileJson className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* SVG for edges */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ minWidth: 2000, minHeight: 1000 }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="#fbbf24" />
              </marker>
            </defs>
            {edges.map((edge) => {
              const source = getNodeCenter(edge.source)
              const target = getNodeCenter(edge.target)
              const isPrereq = edge.type === "prerequisite"

              return (
                <g key={edge.id}>
                  <path
                    d={`M ${source.x} ${source.y} Q ${(source.x + target.x) / 2} ${source.y} ${target.x} ${target.y}`}
                    stroke={isPrereq ? "#fbbf24" : "#cbd5e1"}
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={isPrereq ? "5,5" : "0"}
                    markerEnd={isPrereq ? "url(#arrowhead)" : ""}
                  />
                  {isPrereq && (
                    <text
                      x={(source.x + target.x) / 2}
                      y={source.y - 10}
                      fill="#f59e0b"
                      fontSize="12"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      Prerequisito
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id

            return (
              <div
                key={node.id}
                className={cn(
                  "absolute cursor-pointer transition-transform hover:scale-105",
                  isSelected && "ring-2 ring-primary/80 rounded-xl",
                )}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                }}
                onClick={() => {
                  setSelectedNodeId(node.id)
                  setSelectedNodeType(node.type)
                }}
              >
                {node.type === "programa" && (
                  <div className="w-[300px] rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-5 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <BookOpen className="h-8 w-8" />
                      <h3 className="text-xl font-bold">{node.data.nombre}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {node.data.fases_count} fases
                      </Badge>
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {node.data.pp_count} proof points
                      </Badge>
                    </div>
                  </div>
                )}

                {node.type === "fase" && (
                  <div className="w-[250px] rounded-lg bg-blue-50 border-2 border-blue-300 p-4 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-600">Fase {node.data.numero}</span>
                      {node.data.documentacion_completa ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <h4 className="text-base font-semibold mb-3">{node.data.nombre}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {node.data.proof_points_count} PPs
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {node.data.duracion_semanas} sem
                      </Badge>
                    </div>
                  </div>
                )}

                {node.type === "proofPoint" && (
                  <div
                    className={cn(
                      "w-[220px] rounded-lg bg-cyan-50 border-2 border-cyan-300 p-3 shadow-md",
                      !node.data.contenido_listo && "border-dashed",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-cyan-600" />
                      <h5 className="text-sm font-semibold flex-1">{node.data.nombre}</h5>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {node.data.niveles_count} niveles
                      </Badge>
                      {!node.data.contenido_listo && (
                        <Badge variant="outline" className="text-xs text-amber-600">
                          Sin contenido
                        </Badge>
                      )}
                    </div>
                    {node.data.prerequisitos_count > 0 && (
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                        Requiere {node.data.prerequisitos_count} PP
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Detail Panel */}
        {selectedNodeId && (
          <Card className="absolute top-4 right-4 w-[400px] max-h-[calc(100vh-200px)] overflow-y-auto shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detalles</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedNodeId(null)
                    setSelectedNodeType(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Separator className="mb-4" />
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Tipo</p>
                  <Badge>{selectedNodeType}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Nombre</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedNodeType === "programa" && localPrograma.nombre}
                    {selectedNodeType === "fase" && selectedFase?.nombre}
                    {selectedNodeType === "proofPoint" && selectedProofPoint?.nombre}
                  </p>
                </div>

                {selectedNodeType === "programa" && (
                  <>
                    <div>
                      <p className="text-sm font-medium mb-1">Descripción</p>
                      <p className="text-sm text-muted-foreground">{localPrograma.descripcion}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{localPrograma.fases.length} fases</span>
                      <span>{allProofPoints.length} proof points</span>
                    </div>
                  </>
                )}

                {selectedNodeType === "fase" && selectedFase && (
                  <>
                    <div>
                      <p className="text-sm font-medium mb-1">Número</p>
                      <p className="text-sm text-muted-foreground">Fase {selectedFase.numero}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Proof Points</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFase.proof_points.length} proof points
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Duración</p>
                      <p className="text-sm text-muted-foreground">{selectedFase.duracion_semanas} semanas</p>
                    </div>
                    <Button className="w-full" onClick={() => handleAddProofPoint(selectedFase.id)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir Proof Point
                    </Button>
                  </>
                )}

                {selectedNodeType === "proofPoint" && selectedProofPoint && (
                  <>
                    <div>
                      <p className="text-sm font-medium mb-1">Niveles</p>
                      <p className="text-sm text-muted-foreground">{selectedProofPoint.numero_niveles} niveles</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Prerequisitos</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedProofPoint.prerequisitos.length} prerequisitos
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Pregunta central</p>
                      <p className="text-sm text-muted-foreground">{selectedProofPoint.pregunta_central}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Gestionar prerequisitos</p>
                      {availablePrereqOptions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay otros proof points disponibles.</p>
                      ) : (
                        <div className="space-y-2">
                          {availablePrereqOptions.map((option) => {
                            const isChecked = selectedProofPoint.prerequisitos.includes(option.id)
                            return (
                              <label key={option.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    const shouldAdd = checked === true
                                    const nextPrereqs = shouldAdd
                                      ? [...selectedProofPoint.prerequisitos, option.id]
                                      : selectedProofPoint.prerequisitos.filter((id) => id !== option.id)
                                    void handleUpdatePrereqs(selectedProofPoint.id, nextPrereqs)
                                  }}
                                />
                                <span>{option.nombre}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Minimap */}
        <div className="absolute bottom-4 right-4 w-48 h-32 bg-white border rounded shadow-lg p-2">
          <div className="text-xs font-medium mb-2 text-muted-foreground">Vista General</div>
          <div className="relative w-full h-full bg-slate-100 rounded overflow-hidden">
            {nodes.map((node) => (
              <div
                key={node.id}
                className={cn(
                  "absolute rounded",
                  node.type === "programa" && "bg-cyan-600",
                  node.type === "fase" && "bg-blue-500",
                  node.type === "proofPoint" && "bg-cyan-400",
                )}
                style={{
                  left: `${(node.position.x / 2000) * 100}%`,
                  top: `${(node.position.y / 1000) * 100}%`,
                  width: node.type === "programa" ? "8px" : node.type === "fase" ? "6px" : "5px",
                  height: node.type === "programa" ? "8px" : node.type === "fase" ? "6px" : "5px",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {editionMode && (
        <div className="border-t bg-white">
          <div className="p-4 space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">Orden de Fases</h4>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePhaseDragEnd}>
              <SortableContext items={localPrograma.fases.map((fase) => fase.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2">
                  {localPrograma.fases.map((fase) => (
                    <SortablePhaseItem
                      key={fase.id}
                      fase={fase}
                      isSelected={selectedFaseId === fase.id}
                      onSelect={() => {
                        setSelectedNodeId(buildNodeId("fase", fase.id))
                        setSelectedNodeType("fase")
                      }}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>

          {selectedFase && (
            <div className="border-t p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase">
                  Proof Points en {selectedFase.nombre}
                </h4>
                <Button size="sm" variant="outline" onClick={() => handleAddProofPoint(selectedFase.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Proof Point
                </Button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleProofPointDragEnd(selectedFase.id)}
              >
                <SortableContext
                  items={selectedFase.proof_points.map((pp) => pp.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-2">
                    {selectedFase.proof_points.map((pp) => (
                      <SortableProofPointItem
                        key={pp.id}
                        proofPoint={pp}
                        isSelected={selectedProofPointId === pp.id}
                        onSelect={() => {
                          setSelectedNodeId(buildNodeId("proofPoint", pp.id))
                          setSelectedNodeType("proofPoint")
                        }}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface SortablePhaseItemProps {
  fase: Fase
  isSelected: boolean
  onSelect: () => void
}

function SortablePhaseItem({ fase, isSelected, onSelect }: SortablePhaseItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: fase.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm shadow-sm",
        isDragging && "opacity-70 shadow-md",
        isSelected && "border-primary bg-primary/10",
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <span {...listeners} {...attributes} className="cursor-grab text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </span>
        <button type="button" className="flex flex-col text-left flex-1" onClick={onSelect}>
          <span className="text-xs text-muted-foreground">Fase {fase.numero}</span>
          <span className="font-medium">{fase.nombre}</span>
        </button>
      </div>
      <Badge variant="outline" className="text-xs">
        {fase.proof_points.length} PPs
      </Badge>
    </li>
  )
}

interface SortableProofPointItemProps {
  proofPoint: ProofPoint
  isSelected: boolean
  onSelect: () => void
}

function SortableProofPointItem({ proofPoint, isSelected, onSelect }: SortableProofPointItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: proofPoint.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm shadow-sm",
        isDragging && "opacity-70 shadow-md",
        isSelected && "border-primary bg-primary/10",
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <span {...listeners} {...attributes} className="cursor-grab text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </span>
        <button type="button" className="flex flex-col text-left flex-1" onClick={onSelect}>
          <span className="font-medium">{proofPoint.nombre}</span>
          <span className="text-xs text-muted-foreground">
            {proofPoint.prerequisitos.length} prerequisitos
          </span>
        </button>
      </div>
      <Badge variant="outline" className="text-xs">
        {proofPoint.numero_niveles} niveles
      </Badge>
    </li>
  )
}
