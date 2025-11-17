import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, MessageSquare } from "lucide-react"
import type { SimulationScenario } from "../types"

const difficultyTone: Record<SimulationScenario["nivel_dificultad"], string> = {
  principiante: "bg-green-500",
  intermedio: "bg-yellow-500",
  avanzado: "bg-red-500",
}

interface ScenarioSummaryProps {
  content: SimulationScenario
}

export function ScenarioSummary({ content }: ScenarioSummaryProps) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {content.titulo}
            </CardTitle>
            <p className="text-sm text-foreground/80">{content.descripcion}</p>
          </div>
          <Badge className={difficultyTone[content.nivel_dificultad]}>
            {content.nivel_dificultad}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="mb-1 text-sm font-semibold">Tu Objetivo:</h4>
            <p className="text-sm text-foreground/90">{content.objetivo_estudiante}</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
            <Avatar>
              <AvatarFallback>
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{content.personaje_ia.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {content.personaje_ia.rol} • {content.personaje_ia.tono}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
