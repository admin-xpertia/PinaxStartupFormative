import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock, Play, Lock } from "lucide-react"
import type { ProofPointExercise, ProofPointOverview } from "@/types/proof-point"
import { getExerciseTypeLabel } from "@/lib/proof-point"
import { cn } from "@/lib/utils"

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
    <div className="w-full max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="space-y-4 text-center md:text-left">
        <Badge variant="outline" className="mb-2">
          {proofPoint.nivelNombre}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{proofPoint.nombre}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {proofPoint.descripcion}
        </p>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Progress value={proofPoint.progress} className="w-32 h-2" />
            <span className="text-sm font-semibold text-muted-foreground">
              {Math.round(proofPoint.progress)}% Completado
            </span>
          </div>
        </div>
      </div>

      {highlightExercise && highlightExercise.status !== "completed" && (
        <Card className="border-l-4 border-l-primary bg-slate-50/50 shadow-sm">
          <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="default"
                  className="bg-primary/10 text-primary hover:bg-primary/20 border-none"
                >
                  Siguiente Paso Recomendado
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {highlightExercise.estimatedMinutes} min
                </span>
              </div>
              <h3 className="text-xl font-semibold">{highlightExercise.nombre}</h3>
            </div>
            <Button
              size="lg"
              onClick={() => onStartExercise(highlightExercise)}
              className="shrink-0 w-full sm:w-auto"
            >
              {highlightExercise.status === "in_progress" ? "Continuar" : "Comenzar"}
              <Play className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          Actividades del Módulo
          <Badge variant="secondary" className="rounded-full ml-2">
            {proofPoint.exercises.length}
          </Badge>
        </h2>

        <div className="grid gap-3">
          {proofPoint.exercises.map((exercise) => {
            const isLocked = exercise.status === "locked"
            const isCompleted = exercise.status === "completed"

            return (
              <div
                key={exercise.id}
                onClick={() => !isLocked && onStartExercise(exercise)}
                className={cn(
                  "group flex items-center justify-between p-4 rounded-xl border bg-white transition-all",
                  isLocked
                    ? "opacity-60 bg-slate-50 cursor-not-allowed"
                    : "hover:border-primary/40 hover:shadow-md cursor-pointer"
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      isCompleted
                        ? "bg-green-100 text-green-600"
                        : isLocked
                          ? "bg-slate-100 text-slate-400"
                          : "bg-primary/10 text-primary"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isLocked ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </div>

                  <div>
                    <h4
                      className={cn(
                        "font-medium text-base",
                        isCompleted && "text-muted-foreground line-through decoration-slate-300"
                      )}
                    >
                      {exercise.nombre}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                        {getExerciseTypeLabel(exercise.tipo)}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {exercise.estimatedMinutes} min
                      </span>
                    </div>
                  </div>
                </div>

                {!isLocked && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {hasObjectives && (
        <div className="pt-8 border-t">
          <h3 className="font-semibold mb-4">Objetivos de aprendizaje</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {objectives.map((obj) => (
              <li key={obj} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
