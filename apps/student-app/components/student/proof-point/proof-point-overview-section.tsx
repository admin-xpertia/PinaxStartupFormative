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
  objectives: string[]
  onStartExercise: (exercise: ProofPointExercise) => void
}

export function ProofPointOverviewSection({
  proofPoint,
  highlightExercise,
  objectives,
  onStartExercise,
}: ProofPointOverviewSectionProps) {
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
        <Card className="border-primary/20 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Tu siguiente paso recomendado</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">
                {getExerciseTypeLabel(highlightExercise.tipo)}
              </Badge>
              <p className="text-lg font-semibold text-foreground">{highlightExercise.nombre}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>~{highlightExercise.estimatedMinutes} minutos</span>
                {highlightExercise.status === "in_progress" && (
                  <>
                    <span>•</span>
                    <span>{Math.round(highlightExercise.progress)}% completado</span>
                  </>
                )}
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => onStartExercise(highlightExercise)}
              className="gap-2"
            >
              {highlightExercise.status === "in_progress" ? "Continuar" : "Comenzar"}
              <Play className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Objetivos de Aprendizaje</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {objectives.map((objective) => (
              <li key={objective} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{objective}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
