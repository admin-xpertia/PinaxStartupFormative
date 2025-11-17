"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type SubmissionStatus =
  | "submitted_for_review"
  | "requires_iteration"
  | "approved"
  | "in_progress"

export interface SubmissionItem {
  progressId: string
  estudiante: string
  ejercicio: string
  entregadoEl: string
  status: SubmissionStatus
}

interface SubmissionQueueProps {
  submissions: SubmissionItem[]
  programId: string
}

const statusCopy: Record<SubmissionStatus, string> = {
  submitted_for_review: "En revisión",
  requires_iteration: "Cambios solicitados",
  approved: "Aprobado",
  in_progress: "En progreso",
}

export function SubmissionQueue({ submissions, programId }: SubmissionQueueProps) {
  const visibles = submissions.filter(
    (item) => item.status === "submitted_for_review",
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Bandeja de entregas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay entregas pendientes de revisión.
          </p>
        ) : (
          <div className="divide-y">
            {visibles.map((submission) => (
              <div
                key={submission.progressId}
                className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold">{submission.estudiante}</div>
                  <div className="text-sm text-muted-foreground">
                    {submission.ejercicio}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Entregado el {new Date(submission.entregadoEl).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{statusCopy[submission.status]}</Badge>
                  <Button size="sm" asChild>
                    <Link
                      href={`/programas/${encodeURIComponent(programId)}/analytics/submission/${encodeURIComponent(submission.progressId)}`}
                    >
                      Revisar
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
