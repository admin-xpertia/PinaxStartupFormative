"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { ProgramFormData, FaseFormData } from "@/types/wizard"

interface Step2Props {
  data: ProgramFormData
  onUpdate: (data: Partial<ProgramFormData>) => void
}

export function Step2Phases({ data, onUpdate }: Step2Props) {
  const [expandedFase, setExpandedFase] = useState<number>(0)

  // Initialize fases based on numero_fases
  useEffect(() => {
    if (data.fases.length !== data.numero_fases) {
      const newFases: FaseFormData[] = Array.from({ length: data.numero_fases }, (_, i) => ({
        id: `fase_${Date.now()}_${i}`,
        nombre_fase: data.fases[i]?.nombre_fase || "",
        descripcion_fase: data.fases[i]?.descripcion_fase || "",
        objetivos_aprendizaje: data.fases[i]?.objetivos_aprendizaje || "",
        duracion_semanas_fase: data.fases[i]?.duracion_semanas_fase || 0,
        numero_proof_points: data.fases[i]?.numero_proof_points || 3,
        proof_points: data.fases[i]?.proof_points || [],
      }))
      onUpdate({ fases: newFases })
    }
  }, [data.numero_fases])

  const updateFase = (index: number, updates: Partial<FaseFormData>) => {
    const newFases = [...data.fases]
    newFases[index] = { ...newFases[index], ...updates }
    onUpdate({ fases: newFases })
  }

  const totalSemanasFases = data.fases.reduce((sum, fase) => sum + (fase.duracion_semanas_fase || 0), 0)
  const exceedsDuration = totalSemanasFases > data.duracion_semanas

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Estructura de Fases</h2>
        <p className="mt-2 text-base text-muted-foreground">
          Define las fases temáticas del programa. Cada fase agrupa proof points relacionados.
        </p>
      </div>

      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm">
          Crearás <span className="font-semibold">{data.numero_fases} fases</span> según lo configurado en el paso
          anterior.
        </p>
      </div>

      <div className="space-y-4">
        {data.fases.map((fase, index) => (
          <div key={fase.id} className="rounded-lg border bg-card">
            <button
              onClick={() => setExpandedFase(expandedFase === index ? -1 : index)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">Fase {index + 1}</span>
                {fase.nombre_fase && <span className="text-sm text-muted-foreground">- {fase.nombre_fase}</span>}
              </div>
              {expandedFase === index ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expandedFase === index && (
              <div className="space-y-6 border-t p-6">
                <div className="space-y-2">
                  <Label>Nombre de la Fase *</Label>
                  <Input
                    placeholder="Ej: Proof Points Fundamentales, Validación de Mercado"
                    value={fase.nombre_fase}
                    onChange={(e) => updateFase(index, { nombre_fase: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <Textarea
                    placeholder="¿Qué aprenderán en esta fase?"
                    rows={3}
                    value={fase.descripcion_fase}
                    onChange={(e) => updateFase(index, { descripcion_fase: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Objetivos de Aprendizaje</Label>
                  <Textarea
                    placeholder="• Objetivo 1&#10;• Objetivo 2&#10;• Objetivo 3"
                    rows={4}
                    value={fase.objetivos_aprendizaje}
                    onChange={(e) => updateFase(index, { objetivos_aprendizaje: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">Lista los objetivos clave (uno por línea)</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Duración Estimada (semanas)</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="3"
                      value={fase.duracion_semanas_fase || ""}
                      onChange={(e) =>
                        updateFase(index, { duracion_semanas_fase: Number.parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Número de Proof Points</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      placeholder="3"
                      value={fase.numero_proof_points}
                      onChange={(e) => updateFase(index, { numero_proof_points: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Validation Summary */}
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold">Resumen de Duración</h3>
        <div className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Total semanas de fases:</span>
            <span className={cn(exceedsDuration && "font-semibold text-warning")}>{totalSemanasFases} semanas</span>
          </div>
          <div className="flex justify-between">
            <span>Duración del programa:</span>
            <span>{data.duracion_semanas} semanas</span>
          </div>
        </div>
        {exceedsDuration && (
          <div className="mt-3 rounded-md bg-warning/10 p-3 text-sm text-warning-foreground">
            ⚠️ La suma de semanas de fases excede la duración del programa
          </div>
        )}
      </div>
    </div>
  )
}
