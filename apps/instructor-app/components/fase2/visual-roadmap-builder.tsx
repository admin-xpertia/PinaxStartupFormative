"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
} from "lucide-react"
import type { Fase } from "@/types/fase"
import { cn } from "@/lib/utils"

interface VisualRoadmapBuilderProps {
  programaId: string
  programa: ProgramaData
  onUpdate: (updatedPrograma: ProgramaData) => Promise<void>
  readonly?: boolean
}

interface ProgramaData {
  id: string
  nombre: string
  descripcion: string
  fases: Fase[]
}

interface NodePosition {
  x: number
  y: number
}

interface RoadmapNode {
  id: string
  type: "programa" | "fase" | "proofPoint"
  position: NodePosition
  data: any
}

interface RoadmapEdge {
  id: string
  source: string
  target: string
  type: "normal" | "prerequisite"
}

export function VisualRoadmapBuilder({ programaId, programa, onUpdate, readonly = false }: VisualRoadmapBuilderProps) {
  const [editionMode, setEditionMode] = useState(!readonly)
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const { nodes, edges } = useMemo(() => {
    const nodes: RoadmapNode[] = []
    const edges: RoadmapEdge[] = []

    // Programa node
    const ppCount = programa.fases.reduce((acc, f) => acc + f.proof_points.length, 0)
    nodes.push({
      id: `programa-${programa.id}`,
      type: "programa",
      position: { x: 50, y: 300 },
      data: {
        nombre: programa.nombre,
        fases_count: programa.fases.length,
        pp_count: ppCount,
      },
    })

    // Fase and ProofPoint nodes
    programa.fases.forEach((fase, faseIdx) => {
      const faseId = `fase-${fase.id}`
      nodes.push({
        id: faseId,
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

      // Programa to Fase edge
      edges.push({
        id: `e-programa-${fase.id}`,
        source: `programa-${programa.id}`,
        target: faseId,
        type: "normal",
      })

      fase.proof_points.forEach((pp, ppIdx) => {
        const ppId = `pp-${pp.id}`
        nodes.push({
          id: ppId,
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

        // Fase to ProofPoint edge
        edges.push({
          id: `e-fase-${pp.id}`,
          source: faseId,
          target: ppId,
          type: "normal",
        })

        // Prerequisito edges
        pp.prerequisitos.forEach((prereqId) => {
          edges.push({
            id: `e-prereq-${pp.id}-${prereqId}`,
            source: `pp-${prereqId}`,
            target: ppId,
            type: "prerequisite",
          })
        })
      })
    })

    return { nodes, edges }
  }, [programa, editionMode])

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
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Fase
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
          {nodes.map((node) => (
            <div
              key={node.id}
              className="absolute cursor-pointer transition-transform hover:scale-105"
              style={{
                left: node.position.x,
                top: node.position.y,
              }}
              onClick={() => setSelectedNode(node)}
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
          ))}
        </div>

        {/* Detail Panel */}
        {selectedNode && (
          <Card className="absolute top-4 right-4 w-[400px] max-h-[calc(100vh-200px)] overflow-y-auto shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detalles</h3>
                <Button size="sm" variant="ghost" onClick={() => setSelectedNode(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Separator className="mb-4" />
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Tipo</p>
                  <Badge>{selectedNode.type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Nombre</p>
                  <p className="text-sm text-muted-foreground">{selectedNode.data.nombre}</p>
                </div>
                {selectedNode.type === "fase" && (
                  <>
                    <div>
                      <p className="text-sm font-medium mb-1">Número</p>
                      <p className="text-sm text-muted-foreground">Fase {selectedNode.data.numero}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Proof Points</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedNode.data.proof_points_count} proof points
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Duración</p>
                      <p className="text-sm text-muted-foreground">{selectedNode.data.duracion_semanas} semanas</p>
                    </div>
                    <Button className="w-full">Editar Fase</Button>
                  </>
                )}
                {selectedNode.type === "proofPoint" && (
                  <>
                    <div>
                      <p className="text-sm font-medium mb-1">Niveles</p>
                      <p className="text-sm text-muted-foreground">{selectedNode.data.niveles_count} niveles</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Prerequisitos</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedNode.data.prerequisitos_count} prerequisitos
                      </p>
                    </div>
                    <Button className="w-full">Configurar Niveles</Button>
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
    </div>
  )
}
