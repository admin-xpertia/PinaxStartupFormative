"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type SubmissionStatus =
  | "submitted_for_review"
  | "pending_review"
  | "requires_iteration"
  | "approved"
  | "graded"
  | "in_progress"

export interface SubmissionItem {
  progressId: string
  estudiante: string
  ejercicio: string
  entregadoEl: string
  status: SubmissionStatus
  aiScore?: number | null
}

interface SubmissionQueueProps {
  submissions: SubmissionItem[]
  programId: string
}

const statusCopy: Record<SubmissionStatus, string> = {
  submitted_for_review: "Pendiente",
  pending_review: "Pendiente",
  requires_iteration: "Cambios solicitados",
  approved: "Aprobado",
  graded: "Calificado",
  in_progress: "En progreso",
}

function getWaitTimeLabel(entregadoEl: string) {
  const submitted = new Date(entregadoEl)
  if (Number.isNaN(submitted.getTime())) return "N/D"
  const diff = Date.now() - submitted.getTime()
  const minutes = Math.max(Math.floor(diff / 60000), 0)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  return `${days} d`
}

export function SubmissionQueue({ submissions, programId }: SubmissionQueueProps) {
  const pendientes = submissions
    .filter((item) => item.status === "submitted_for_review" || item.status === "pending_review")
    .sort((a, b) => new Date(a.entregadoEl).getTime() - new Date(b.entregadoEl).getTime())

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Bandeja de revisión</CardTitle>
          <CardDescription>Prioriza las entregas y revisa con IA</CardDescription>
        </div>
        <Badge variant="secondary" className="self-start">
          {pendientes.length} pendientes
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
              🎉
            </div>
            <p className="text-lg font-semibold">Todo al día</p>
            <p className="text-sm text-muted-foreground">
              No hay entregas pendientes. Relájate o revisa el progreso del cohorte.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="text-left">
                  <th className="py-2 font-medium">Estudiante</th>
                  <th className="py-2 font-medium">Ejercicio</th>
                  <th className="py-2 font-medium text-center">Sugerencia IA</th>
                  <th className="py-2 font-medium text-center">Tiempo de espera</th>
                  <th className="py-2 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((submission) => (
                  <tr key={submission.progressId} className="border-t">
                    <td className="py-3 pr-3">
                      <div className="font-medium">{submission.estudiante}</div>
                      <div className="text-xs text-muted-foreground">{statusCopy[submission.status]}</div>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{submission.ejercicio}</td>
                    <td className="py-3 text-center">
                      {submission.aiScore !== undefined && submission.aiScore !== null ? (
                        <Badge variant="outline" className="bg-primary/5 text-primary">
                          {submission.aiScore}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="py-3 text-center text-muted-foreground" title={new Date(submission.entregadoEl).toLocaleString()}>
                      {getWaitTimeLabel(submission.entregadoEl)}
                    </td>
                    <td className="py-3 text-right">
                      <Button size="sm" asChild>
                        <Link
                          href={`/programas/${encodeURIComponent(programId)}/grade/${encodeURIComponent(submission.progressId)}`}
                        >
                          Revisar
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
