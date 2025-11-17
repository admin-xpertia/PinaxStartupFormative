import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock, Play } from "lucide-react"
import type { ProofPointExercise, ProofPointOverview } from "@/types/proof-point"
import { getExerciseTypeLabel } from "@/lib/proof-point"

interface ProofPointOverviewSectionProps {
  proofPoint: ProofPointOverview
  highlightExercise: ProofPointExercise | null
  objectives?: string[]
  onStartExercise: (exercise: ProofPointExercise) => void
}

export function ProofPointOverviewSection({
  proofPoint,
  highlightExercise,
  objectives = [],
  onStartExercise,
}: ProofPointOverviewSectionProps) {
  const hasObjectives = objectives.length > 0

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
      <Card className="border-none bg-gradient-to-r from-primary/10 via-primary/5 to-white shadow-md">
        <CardContent className="space-y-3 p-6">
          <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider">
            {proofPoint.nivelNombre}
          </Badge>
          <h2 className="text-3xl font-semibold text-foreground">{proofPoint.nombre}</h2>
          <p className="text-base text-muted-foreground">{proofPoint.descripcion}</p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{proofPoint.phaseNombre}</span>
            <span>•</span>
            <span>{proofPoint.exercises.length} ejercicios</span>
          </div>
          <div className="pt-2">
            <p className="text-sm text-muted-foreground">Avance en este proof point</p>
            <div className="mt-1 flex items-center gap-3">
              <Progress value={proofPoint.progress} className="h-2 flex-1" />
              <span className="text-sm font-semibold text-foreground">
                {Math.round(proofPoint.progress)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {highlightExercise && (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-white to-white shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-primary">
                  {highlightExercise.status === "in_progress"
                    ? "🎯 Tu Misión Semanal"
                    : "✨ Comencemos tu Aprendizaje"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {highlightExercise.status === "in_progress"
                    ? "Retoma donde lo dejaste y continúa avanzando..."
                    : "Estás listo para comenzar. Tu primer paso es..."}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {getExerciseTypeLabel(highlightExercise.tipo)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-foreground leading-tight">
                {highlightExercise.nombre}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">~{highlightExercise.estimatedMinutes} minutos</span>
                </div>
                {highlightExercise.status === "in_progress" && highlightExercise.progress > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-2">
                      <Progress value={highlightExercise.progress} className="h-2 w-24" />
                      <span className="font-semibold text-primary">
                        {Math.round(highlightExercise.progress)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => onStartExercise(highlightExercise)}
              className="gap-2 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {highlightExercise.status === "in_progress" ? "Continuar Ejercicio" : "Comenzar Ahora"}
              <Play className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Objetivos de Aprendizaje</CardTitle>
        </CardHeader>
        <CardContent>
          {hasObjectives ? (
            <ul className="space-y-3">
              {objectives.map((objective) => (
                <li key={objective} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{objective}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no hay objetivos detallados para este proof point. Pronto estarán disponibles.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
