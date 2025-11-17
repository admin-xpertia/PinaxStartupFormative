import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, TrendingUp, Clock } from "lucide-react"
import type { Enrollment } from "@shared-types/enrollment"

interface ProgramCardProps {
  enrollment: Enrollment
  onSelect: () => void
}

export function ProgramCard({ enrollment, onSelect }: ProgramCardProps) {
  const progressPercentage = enrollment.overallProgress || 0
  const completionRatio = `${enrollment.completedProofPoints || 0}/${enrollment.totalProofPoints || 0}`

  const statusLabels = {
    active: "En progreso",
    completed: "Completado",
    dropped: "Pausado",
  }

  const statusColors = {
    active: "bg-blue-500",
    completed: "bg-green-500",
    dropped: "bg-gray-400",
  }

  const formatDate = (date?: Date) => {
    if (!date) return "En progreso"
    const parsed = typeof date === "string" ? new Date(date) : date
    if (Number.isNaN(parsed.getTime())) return "En progreso"
    return parsed.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card
      className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-l-primary hover:scale-[1.02]"
      onClick={onSelect}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              {enrollment.programName}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Instructor: {enrollment.instructorName}
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-xs font-semibold"
          >
            {statusLabels[enrollment.status]}
          </Badge>
        </div>
        {enrollment.programDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {enrollment.programDescription}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso general</span>
            <span className="font-semibold text-foreground">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{completionRatio} Proof Points</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatDate(enrollment.estimatedCompletionDate)}</span>
          </div>
        </div>

        {/* Progress Indicator */}
        {enrollment.status === "active" && progressPercentage > 0 && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">
              {progressPercentage < 30
                ? "Recién comenzando"
                : progressPercentage < 70
                  ? "Avanzando bien"
                  : "¡Casi terminando!"}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
          size="lg"
        >
          {enrollment.status === "completed"
            ? "Revisar Programa"
            : progressPercentage > 0
              ? "Continuar Aprendizaje"
              : "Comenzar Programa"}
        </Button>
      </CardFooter>
    </Card>
  )
}
