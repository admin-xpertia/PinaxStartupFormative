import { BookOpen, Clock } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  countCompletedExercises,
  estimatePendingMinutes,
  exerciseStatusTokens,
  getExerciseTypeLabel,
} from "@/lib/proof-point"
import type { ProofPointExercise, ProofPointOverview } from "@/types/proof-point"

interface ProofPointSidebarProps {
  proofPoint: ProofPointOverview
  exercisesLoading: boolean
  publishedExercisesCount?: number
  exercises: ProofPointExercise[]
  selectedExerciseIdx: number | null
  onSelectExercise: (exercise: ProofPointExercise, idx: number) => void
}

export function ProofPointSidebar({
  proofPoint,
  exercisesLoading,
  publishedExercisesCount,
  exercises,
  selectedExerciseIdx,
  onSelectExercise,
}: ProofPointSidebarProps) {
  const completedCount = countCompletedExercises(exercises)
  const pendingMinutes = estimatePendingMinutes(exercises)

  return (
    <aside className="w-full border-r bg-white/70 lg:w-80">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="space-y-4 p-4">
          <Card>
            <CardHeader>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{proofPoint.phaseNombre}</p>
                <CardTitle className="text-base">{proofPoint.nivelNombre}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{proofPoint.descripcion}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tu progreso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completados</span>
                <span className="font-semibold">
                  {completedCount} / {exercises.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tiempo estimado</span>
                <span className="font-semibold">{pendingMinutes} min</span>
              </div>
              <Progress value={proofPoint.progress} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                Ejercicios
                {publishedExercisesCount ? (
                  <Badge variant="secondary" className="text-xs">
                    {publishedExercisesCount} publicados
                  </Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {exercisesLoading && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Cargando ejercicios...
                </p>
              )}

              {!exercisesLoading && exercises.length === 0 && (
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No hay ejercicios publicados aún</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    El instructor está preparando los ejercicios para este proof point
                  </p>
                </div>
              )}

              {!exercisesLoading &&
                exercises.map((exercise, idx) => {
                  const tokens = exerciseStatusTokens[exercise.status]
                  return (
                    <button
                      key={exercise.id}
                      onClick={() => onSelectExercise(exercise, idx)}
                      disabled={exercise.status === "locked"}
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-all",
                        tokens.card,
                        exercise.status === "locked" && "cursor-not-allowed opacity-60",
                        selectedExerciseIdx === idx && "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className={cn("text-xs", tokens.badge)}>
                          {getExerciseTypeLabel(exercise.tipo)}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">{exercise.nombre}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{exercise.estimatedMinutes} min</span>
                          </div>
                          {exercise.status !== "completed" && exercise.status !== "locked" && (
                            <Progress value={exercise.progress} className="mt-2 h-1" />
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </aside>
  )
}
