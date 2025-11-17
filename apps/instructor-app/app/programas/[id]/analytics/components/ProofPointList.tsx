"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Exercise = {
  id: string
  nombre: string
  estadoContenido?: string
  esObligatorio?: boolean
}

type ProofPoint = {
  id: string
  nombre: string
  faseNombre?: string
  ejercicios: Exercise[]
}

function statusLabel(exercise: Exercise) {
  const status = exercise.estadoContenido
  if (status === "publicado") return { label: "Publicado", variant: "default" as const }
  if (status === "generado" || status === "draft") return { label: "Borrador", variant: "secondary" as const }
  return { label: "Pendiente", variant: "outline" as const }
}

export function ProofPointList({ proofPoints }: { proofPoints: ProofPoint[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Proof points y ejercicios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {proofPoints.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay proof points configurados para este programa.
          </p>
        ) : (
          <div className="space-y-3">
            {proofPoints.map((pp) => (
              <div key={pp.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{pp.nombre}</div>
                    {pp.faseNombre ? (
                      <div className="text-xs text-muted-foreground">
                        Fase: {pp.faseNombre}
                      </div>
                    ) : null}
                  </div>
                  <Badge variant="secondary">
                    {pp.ejercicios.filter((e) => e.estadoContenido === "publicado").length} publicados
                  </Badge>
                </div>

                {pp.ejercicios.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin ejercicios asignados.</p>
                ) : (
                  <div className="space-y-2">
                    {pp.ejercicios.map((ex) => {
                      const status = statusLabel(ex)
                      return (
                        <div key={ex.id} className="flex items-center justify-between text-sm">
                          <div>
                            <div className="font-medium">{ex.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {ex.esObligatorio === false ? "Opcional" : "Obligatorio"}
                            </div>
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
