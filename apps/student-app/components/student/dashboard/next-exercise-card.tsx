import Link from "next/link"
import { ArrowRight, Clock, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { ContinuePoint } from "@/types/progress"

interface NextExerciseCardProps {
  continuePoint?: ContinuePoint | null
  onContinue?: () => void
}

export function NextExerciseCard({ continuePoint, onContinue }: NextExerciseCardProps) {
  return (
    <Card className="border-none bg-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">
            {continuePoint ? "Retoma tu siguiente ejercicio" : "Prepárate para el próximo reto"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {continuePoint ? (
          <>
            <p className="text-sm text-muted-foreground">{continuePoint.proofPointName}</p>
            <h3 className="text-xl font-semibold leading-tight">{continuePoint.exerciseName}</h3>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {continuePoint.estimatedTimeRemaining} min restantes
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {Math.round(continuePoint.progress ?? 0)}% completado
              </span>
            </div>
            <Progress value={continuePoint.progress ?? 0} className="h-2" />
            <Button className="w-full" onClick={onContinue}>
              Continuar ahora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Revisa tus proof points activos y comienza el siguiente ejercicio recomendado para
              mantener el ritmo.
            </p>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/dashboard/progress">Explorar roadmap</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
