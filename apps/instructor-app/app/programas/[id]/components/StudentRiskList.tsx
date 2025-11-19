"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

function getRiskReason(student: StudentRiskItem) {
  if (student.diasInactivo > 7) return "Sin actividad en 1 semana"
  if (student.diasInactivo > 3) return "Varias días sin ingresar"
  if (student.progreso < 10) return "No ha iniciado la fase actual"
  if (student.progreso < 20) return "Progreso por debajo del objetivo"
  return "Monitoreo"
}

export function StudentRiskList({ students }: StudentRiskListProps) {
  const atRisk = students.filter((s) => s.progreso < 35 || s.diasInactivo > 3)

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Radar de riesgo</CardTitle>
        <CardDescription>Detecta quién necesita acompañamiento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {atRisk.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todos los estudiantes mantienen actividad saludable esta semana.
          </p>
        ) : (
          atRisk.map((student) => (
            <div
              key={student.id}
              className="flex flex-col gap-2 rounded-xl border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold leading-none">{student.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.ejercicioActual || "Sin ejercicio asignado"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Prog. {student.progreso}%</Badge>
                  <Badge variant={student.diasInactivo > 7 ? "destructive" : "outline"}>
                    {student.diasInactivo}d sin entrar
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-amber-600">{getRiskReason(student)}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/estudiantes/${encodeURIComponent(student.id)}`}>Ver perfil</Link>
                  </Button>
                  <Button size="sm" variant="secondary" asChild>
                    <Link
                      href={`mailto:?subject=${encodeURIComponent(`Seguimiento ${student.nombre}`)}`}
                    >
                      Contactar
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
