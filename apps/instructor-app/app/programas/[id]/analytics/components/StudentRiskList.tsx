"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface StudentRiskItem {
  id: string
  nombre: string
  progreso: number
  diasInactivo: number
  ejercicioActual?: string
}

interface StudentRiskListProps {
  students: StudentRiskItem[]
}

export function StudentRiskList({ students }: StudentRiskListProps) {
  const atRisk = students.filter(
    (s) => s.progreso < 20 || s.diasInactivo > 3,
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Estudiantes en riesgo</CardTitle>
      </CardHeader>
      <CardContent>
        {atRisk.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay estudiantes en riesgo según los umbrales actuales.
          </p>
        ) : (
          <div className="space-y-3">
            {atRisk.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">{student.nombre}</div>
                  <div className="text-xs text-muted-foreground">
                    {student.ejercicioActual || "Sin ejercicio asignado"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    Progreso {student.progreso}%
                  </Badge>
                  <Badge variant={student.diasInactivo > 7 ? "destructive" : "outline"}>
                    {student.diasInactivo} días inactivo
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
