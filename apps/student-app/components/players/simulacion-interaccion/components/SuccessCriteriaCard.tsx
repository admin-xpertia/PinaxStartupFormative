import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SimulationSuccessCriterion } from "../types"

interface SuccessCriteriaCardProps {
  criterios: SimulationSuccessCriterion[]
  met: Set<number>
  onToggle: (index: number) => void
  onHide?: () => void
}

export function SuccessCriteriaCard({ criterios, met, onToggle, onHide }: SuccessCriteriaCardProps) {
  return (
    <Card className="border-primary/30">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Criterios de Éxito</CardTitle>
          </div>
          {onHide && (
            <Button variant="ghost" size="sm" onClick={onHide}>
              Ocultar
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Los criterios se marcan automáticamente cuando demuestras las habilidades en la conversación
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-3">
          {criterios.map((criterio, idx) => {
            const isMet = met.has(idx)
            // Extract description if criterio is an object
            const descripcion =
              typeof criterio === "string"
                ? criterio
                : criterio.descripcion || String(criterio)

            return (
              <li key={idx} className="flex items-start gap-3 group">
                <div className={cn(
                  "mt-1 h-5 w-5 flex-shrink-0 transition-all duration-300",
                  isMet && "scale-110"
                )}>
                  {isMet ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm leading-6 flex-1 transition-all",
                    isMet && "text-muted-foreground line-through"
                  )}
                >
                  {descripcion}
                </span>
              </li>
            )
          })}
        </ul>
        {met.size > 0 && met.size < criterios.length && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              ¡Progreso! {met.size} de {criterios.length} criterios completados. Continúa la conversación para demostrar las habilidades restantes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
