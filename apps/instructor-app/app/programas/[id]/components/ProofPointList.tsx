"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Estructura del programa</CardTitle>
        <CardDescription>Proof points y ejercicios publicados por fase</CardDescription>
      </CardHeader>
      <CardContent>
        {proofPoints.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay proof points configurados para este programa.
          </p>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-1">
            {proofPoints.map((pp) => {
              const published = pp.ejercicios.filter(
                (e) => (e.estadoContenido ?? "").toLowerCase() === "publicado",
              ).length
              const total = pp.ejercicios.length
              const completion = total === 0 ? 0 : Math.round((published / total) * 100)
              return (
                <AccordionItem
                  key={pp.id}
                  value={pp.id}
                  className="rounded-xl border px-3 py-1 shadow-none"
                >
                  <AccordionTrigger className="flex w-full items-center justify-between gap-2 py-3 text-left text-sm font-semibold">
                    <div>
                      <p>{pp.nombre}</p>
                      {pp.faseNombre && (
                        <p className="text-xs font-normal text-muted-foreground">
                          Fase: {pp.faseNombre}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{completion}% completado</Badge>
                      <Badge variant="outline">
                        {published}/{total} publicados
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-4">
                    {pp.ejercicios.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin ejercicios asignados.</p>
                    ) : (
                      pp.ejercicios.map((ex) => {
                        const status = statusLabel(ex)
                        return (
                          <div
                            key={ex.id}
                            className="flex items-center justify-between rounded-lg border p-2 text-sm"
                          >
                            <div>
                              <div className="font-medium">{ex.nombre}</div>
                              <div className="text-xs text-muted-foreground">
                                {ex.esObligatorio === false ? "Opcional" : "Obligatorio"}
                              </div>
                            </div>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                        )
                      })
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
