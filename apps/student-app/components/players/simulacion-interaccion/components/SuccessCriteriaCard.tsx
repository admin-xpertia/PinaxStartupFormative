import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SuccessCriteriaCardProps {
  criterios: string[]
  met: Set<number>
  onToggle: (index: number) => void
  onHide?: () => void
}

export function SuccessCriteriaCard({ criterios, met, onToggle, onHide }: SuccessCriteriaCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Criterios de Éxito</CardTitle>
          {onHide && (
            <Button variant="ghost" size="sm" onClick={onHide}>
              Ocultar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {criterios.map((criterio, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Checkbox
                id={`criterio-${idx}`}
                checked={met.has(idx)}
                onCheckedChange={() => onToggle(idx)}
              />
              <label
                htmlFor={`criterio-${idx}`}
                className={cn(
                  "text-sm leading-6",
                  met.has(idx) && "text-muted-foreground line-through"
                )}
              >
                {criterio}
              </label>
              {met.has(idx) && <CheckCircle2 className="mt-1 h-4 w-4 text-green-600" />}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
