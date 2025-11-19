"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { type SubmitForGradingResponse } from "@/services/api"

const getScoreLabel = (score: number) => {
  if (score >= 90) return "Excelente"
  if (score >= 75) return "Muy bueno"
  if (score >= 60) return "Aceptable"
  if (score > 0) return "En revisión"
  return "Sin calificación"
}

export interface PreliminaryScoreModalProps {
  open: boolean
  result: SubmitForGradingResponse | null
  onClose: () => void | Promise<void>
  actionLabel?: string
}

export function PreliminaryScoreModal({
  open,
  result,
  onClose,
  actionLabel = "Ir al dashboard",
}: PreliminaryScoreModalProps) {
  const aiScoreValue = Math.round(result?.aiScore ?? 0)
  const aiStrengths = Array.isArray(result?.feedback?.strengths)
    ? result?.feedback?.strengths
    : []
  const aiImprovements = Array.isArray(result?.feedback?.improvements)
    ? result?.feedback?.improvements
    : []
  const aiSummary =
    (result?.feedback as any)?.summary ||
    (result?.feedback as any)?.suggestion ||
    ""
  const scoreLabel = getScoreLabel(aiScoreValue)
  const hasFeedbackContent = Boolean(aiSummary || aiStrengths.length > 0 || aiImprovements.length > 0)

  const handleClose = () => {
    void onClose()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && open) {
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[95vw] max-w-2xl p-0 overflow-hidden max-h-[90vh]"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-b from-primary to-primary/90 text-primary-foreground p-8 flex flex-col items-center gap-5">
            <div className="text-xs uppercase tracking-[0.2em] text-primary-foreground/80">
              Nota preliminar
            </div>
            <div
              className="relative h-40 w-40 rounded-full"
              style={{
                background: `conic-gradient(hsl(var(--primary-foreground)) ${aiScoreValue * 3.6}deg, rgba(255,255,255,0.2) 0deg)`,
              }}
            >
              <div className="absolute inset-3 rounded-full bg-primary-foreground/10 flex items-center justify-center border border-primary-foreground/40">
                <div className="text-center">
                  <div className="text-5xl font-black leading-none">{aiScoreValue}</div>
                  <div className="text-sm font-semibold opacity-80 mt-1">/100</div>
                </div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-sm font-semibold uppercase tracking-wide opacity-90">{scoreLabel}</div>
              <p className="text-sm text-primary-foreground/80">
                Resultado generado automáticamente. El instructor confirmará la nota final.
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
            <DialogHeader className="pt-6 pb-4 text-left">
              <DialogTitle>Calificación preliminar</DialogTitle>
              <DialogDescription>
                La IA analizó tu entrega. El instructor revisará y publicará la nota final.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="uppercase tracking-wide">
                    Pendiente de revisión
                  </Badge>
                  {result?.submittedAt && (
                    <span className="text-xs text-muted-foreground">
                      Enviado {new Date(result.submittedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-base text-foreground">
                  {aiSummary || "Generamos un puntaje automático basado en la rúbrica del ejercicio."}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                {aiStrengths.length > 0 && (
                  <Card className="p-4">
                    <div className="text-sm font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
                      Fortalezas detectadas
                    </div>
                    <ul className="list-disc list-inside text-sm space-y-1 text-foreground">
                      {aiStrengths.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                {aiImprovements.length > 0 && (
                  <Card className="p-4">
                    <div className="text-sm font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
                      Oportunidades de mejora
                    </div>
                    <ul className="list-disc list-inside text-sm space-y-1 text-foreground">
                      {aiImprovements.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                {!hasFeedbackContent && (
                  <p className="text-sm text-muted-foreground">
                    Aún no se generó feedback adicional para esta entrega.
                  </p>
                )}

                <Alert variant="default" className="bg-amber-50 text-amber-900 border-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Nota preliminar</AlertTitle>
                  <AlertDescription>
                    Esta es una calificación preliminar basada en el análisis automático. Tu instructor revisará
                    esta entrega y la nota final podría cambiar.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6">
            <Button onClick={handleClose} className="w-full md:w-auto">
              {actionLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
