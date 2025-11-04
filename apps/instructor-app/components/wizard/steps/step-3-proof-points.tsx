"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Target, GripVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProgramFormData, ProofPointFormData } from "@/types/wizard"

interface Step3Props {
  data: ProgramFormData
  onUpdate: (data: Partial<ProgramFormData>) => void
}

export function Step3ProofPoints({ data, onUpdate }: Step3Props) {
  const [expandedPP, setExpandedPP] = useState<string>("")

  // Initialize proof points for each fase
  useEffect(() => {
    const newFases = data.fases.map((fase) => {
      if (fase.proof_points.length !== fase.numero_proof_points) {
        const newPPs: ProofPointFormData[] = Array.from(
          { length: fase.numero_proof_points },
          (_, i) =>
            fase.proof_points[i] || {
              id: `pp_${Date.now()}_${i}`,
              nombre_pp: "",
              slug_pp: "",
              descripcion_pp: "",
              pregunta_central: "",
              tipo_entregable: "",
              numero_niveles: 3,
              prerequisitos: [],
              duracion_estimada_horas: 0,
            },
        )
        return { ...fase, proof_points: newPPs }
      }
      return fase
    })
    onUpdate({ fases: newFases })
  }, [data.fases.map((f) => f.numero_proof_points).join(",")])

  const updateProofPoint = (faseIndex: number, ppIndex: number, updates: Partial<ProofPointFormData>) => {
    const newFases = [...data.fases]
    const newPPs = [...newFases[faseIndex].proof_points]
    newPPs[ppIndex] = { ...newPPs[ppIndex], ...updates }

    // Auto-generate slug from nombre
    if (updates.nombre_pp) {
      newPPs[ppIndex].slug_pp = updates.nombre_pp
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    }

    newFases[faseIndex] = { ...newFases[faseIndex], proof_points: newPPs }
    onUpdate({ fases: newFases })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Definir Proof Points</h2>
        <p className="mt-2 text-base text-muted-foreground">
          Configura los proof points de cada fase. Los proof points son las unidades fundamentales de validación.
        </p>
      </div>

      <Tabs defaultValue="0" className="w-full">
        <TabsList className="w-full justify-start">
          {data.fases.map((fase, index) => (
            <TabsTrigger key={fase.id} value={index.toString()}>
              {fase.nombre_fase || `Fase ${index + 1}`}
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">{fase.proof_points.length}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {data.fases.map((fase, faseIndex) => (
          <TabsContent key={fase.id} value={faseIndex.toString()} className="space-y-4">
            {fase.proof_points.map((pp, ppIndex) => (
              <div key={pp.id} className="rounded-lg border bg-card">
                <button
                  onClick={() => setExpandedPP(expandedPP === pp.id ? "" : pp.id)}
                  className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <Target className="h-5 w-5 text-primary" />
                  <span className="flex-1 font-medium">{pp.nombre_pp || `Proof Point ${ppIndex + 1}`}</span>
                  {expandedPP === pp.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                {expandedPP === pp.id && (
                  <div className="space-y-6 border-t p-6">
                    <div className="space-y-2">
                      <Label>Nombre del Proof Point *</Label>
                      <Input
                        placeholder="Ej: Customer-Solution Fit, Technical Feasibility"
                        value={pp.nombre_pp}
                        onChange={(e) => updateProofPoint(faseIndex, ppIndex, { nombre_pp: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Identificador (slug)</Label>
                      <Input placeholder="customer-solution-fit" value={pp.slug_pp} readOnly className="bg-muted" />
                      <p className="text-sm text-muted-foreground">
                        Se genera automáticamente del nombre, usado en URLs
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        placeholder="¿Qué valida este proof point?"
                        rows={3}
                        value={pp.descripcion_pp}
                        onChange={(e) => updateProofPoint(faseIndex, ppIndex, { descripcion_pp: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Pregunta Central *</Label>
                      <Input
                        placeholder="¿[Pregunta clave que este PP responde]?"
                        value={pp.pregunta_central}
                        onChange={(e) => updateProofPoint(faseIndex, ppIndex, { pregunta_central: e.target.value })}
                      />
                      <p className="text-sm text-muted-foreground">
                        Ej: ¿Existe un desafío real que afecta a mi audiencia objetivo?
                      </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Tipo de Entregable Final</Label>
                        <Select
                          value={pp.tipo_entregable}
                          onValueChange={(value) => updateProofPoint(faseIndex, ppIndex, { tipo_entregable: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reporte_analisis">Reporte de Análisis</SelectItem>
                            <SelectItem value="canvas_estrategico">Canvas Estratégico</SelectItem>
                            <SelectItem value="prototipo">Prototipo</SelectItem>
                            <SelectItem value="presentacion">Presentación</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Número de Niveles</Label>
                        <Input
                          type="number"
                          min={1}
                          max={6}
                          placeholder="3"
                          value={pp.numero_niveles}
                          onChange={(e) =>
                            updateProofPoint(faseIndex, ppIndex, {
                              numero_niveles: Number.parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Duración Estimada (horas)</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="8"
                        value={pp.duracion_estimada_horas || ""}
                        onChange={(e) =>
                          updateProofPoint(faseIndex, ppIndex, {
                            duracion_estimada_horas: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        Tiempo total estimado para completar todos los niveles
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-4">
                      <h4 className="mb-2 font-medium">Niveles (configurarás en detalle después)</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Nivel 0: Fundamentos</li>
                        <li>• Nivel 1: Aplicación</li>
                        <li>• Nivel 2: Maestría</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
