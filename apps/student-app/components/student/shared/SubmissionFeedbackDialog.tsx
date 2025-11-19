"use client"

import type { ComponentType } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Award, Clock, AlertTriangle, ShieldCheck, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<
  string,
  { label: string; badge: string; icon: ComponentType<{ className?: string }> }
> = {
  graded: {
    label: "Calificado",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: ShieldCheck,
  },
  approved: {
    label: "Aprobado",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: ShieldCheck,
  },
  pending_review: {
    label: "En revisión",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Clock,
  },
  submitted_for_review: {
    label: "Revisión enviada",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Clock,
  },
}

const formatScore = (value?: number | null) =>
  typeof value === "number" ? Number(value.toFixed(1)).toString() : "N/D"

export interface SubmissionFeedback {
  exerciseName: string
  score?: number | null
  aiScore?: number | null
  instructorScore?: number | null
  manualFeedback?: string | null
  feedbackJson?: Record<string, any> | null
  status?: string | null
}

interface SubmissionFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: SubmissionFeedback | null
}

export function SubmissionFeedbackDialog({
  open,
  onOpenChange,
  submission,
}: SubmissionFeedbackDialogProps) {
  if (!submission) return null

  const statusKey = submission.status?.toLowerCase()
  const statusMeta = statusKey ? STATUS_STYLES[statusKey] : null
  const StatusIcon = statusMeta?.icon ?? Award
  const isPending = statusKey === "pending_review" || statusKey === "submitted_for_review"

  const hasStructuredSummary = Boolean(
    submission.feedbackJson?.summary || submission.feedbackJson?.suggestion
  )
  const strengths = Array.isArray(submission.feedbackJson?.strengths)
    ? (submission.feedbackJson!.strengths as string[])
    : []
  const improvements = Array.isArray(submission.feedbackJson?.improvements)
    ? (submission.feedbackJson!.improvements as string[])
    : []
  const hasDetails =
    hasStructuredSummary ||
    strengths.length > 0 ||
    improvements.length > 0 ||
    Boolean(submission.manualFeedback)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{submission.exerciseName || "Feedback de entrega"}</DialogTitle>
          <DialogDescription>
            Vista combinada del feedback automático y los comentarios del instructor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {statusMeta && (
              <Badge variant="outline" className={cn(statusMeta.badge, "flex items-center gap-1")}>
                <StatusIcon className="h-3.5 w-3.5" />
                {statusMeta.label}
              </Badge>
            )}
            <Badge variant="secondary">Nota final: {formatScore(submission.score)}</Badge>
            {submission.aiScore !== null && submission.aiScore !== undefined && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Sugerencia IA: {formatScore(submission.aiScore)}
              </Badge>
            )}
            {submission.instructorScore !== null && submission.instructorScore !== undefined && (
              <Badge variant="outline" className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Instructor: {formatScore(submission.instructorScore)}
              </Badge>
            )}
          </div>

          {isPending && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Tu entrega está en revisión</AlertTitle>
              <AlertDescription>
                Puedes revisar el feedback preliminar generado automáticamente mientras el instructor finaliza la calificación.
              </AlertDescription>
            </Alert>
          )}

          {submission.manualFeedback && (
            <Card className="p-3">
              <div className="text-sm font-semibold mb-1">Comentario del instructor</div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {submission.manualFeedback}
              </p>
            </Card>
          )}

          {hasStructuredSummary ? (
            <div className="space-y-3">
              <div className="text-sm font-semibold">Resumen IA</div>
              <p className="text-sm text-muted-foreground">
                {submission.feedbackJson?.summary || submission.feedbackJson?.suggestion}
              </p>
            </div>
          ) : null}

          {strengths.length > 0 && (
            <Card className="p-3">
              <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-green-600" /> Fortalezas
              </div>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {strengths.map((item: string, idx: number) => (
                  <li key={`strength-${idx}`}>{item}</li>
                ))}
              </ul>
            </Card>
          )}

          {improvements.length > 0 && (
            <Card className="p-3">
              <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> Mejoras sugeridas
              </div>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {improvements.map((item: string, idx: number) => (
                  <li key={`improvement-${idx}`}>{item}</li>
                ))}
              </ul>
            </Card>
          )}

          {!hasDetails && (
            <p className="text-sm text-muted-foreground">
              Aún no hay feedback detallado disponible para esta entrega.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
