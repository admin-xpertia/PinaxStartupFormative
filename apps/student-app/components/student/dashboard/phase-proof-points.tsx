import Link from "next/link"
import { ArrowRight, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Phase } from "@shared-types/enrollment"
import { cn } from "@/lib/utils"
import { proofPointStatusThemes } from "@/lib/dashboard"

interface PhaseProofPointsProps {
  phase?: Phase | null
  onOpenProofPoint: (proofPointId: string) => void
}

export function PhaseProofPoints({ phase, onOpenProofPoint }: PhaseProofPointsProps) {
  return (
    <Card className="border-none bg-white shadow-lg">
      <CardHeader className="flex flex-col gap-1 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{phase ? phase.nombre : "Selecciona una fase"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Conoce el detalle de los proof points y retoma tus ejercicios.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/progress">
              Ver progreso
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!phase && (
          <p className="text-sm text-muted-foreground">
            Selecciona una fase para revisar sus proof points.
          </p>
        )}

        {phase && phase.proofPoints.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Esta fase aún no tiene proof points publicados.
          </p>
        )}

        {phase && phase.proofPoints.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {phase.proofPoints.map((proofPoint) => {
              const theme = proofPointStatusThemes[proofPoint.status]
              return (
                <div
                  key={proofPoint.id}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5",
                    theme.card
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={cn("rounded-full px-3 py-1 text-xs font-medium", theme.badge)}
                    >
                      {theme.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {proofPoint.exercises.length} ejercicios
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">{proofPoint.nombre}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {proofPoint.preguntaCentral || proofPoint.descripcion}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <Progress value={proofPoint.progress} className="h-2 flex-1" />
                    <span className="text-sm font-semibold">{Math.round(proofPoint.progress)}%</span>
                  </div>
                  <Button
                    className="mt-4"
                    size="sm"
                    variant={proofPoint.status === "locked" ? "secondary" : "default"}
                    disabled={proofPoint.status === "locked"}
                    onClick={() => onOpenProofPoint(proofPoint.id)}
                  >
                    {proofPoint.status === "completed"
                      ? "Revisar"
                      : proofPoint.status === "locked"
                        ? "Bloqueado"
                        : "Continuar"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
