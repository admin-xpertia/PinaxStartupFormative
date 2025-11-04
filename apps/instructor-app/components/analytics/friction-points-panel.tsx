import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, AlertTriangle, Info, Sparkles, Edit, Send, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FrictionPoint } from "@/types/analytics"

interface FrictionPointsPanelProps {
  frictionPoints: FrictionPoint[]
}

export function FrictionPointsPanel({ frictionPoints }: FrictionPointsPanelProps) {
  const getSeverityConfig = (severidad: string) => {
    switch (severidad) {
      case "critico":
        return { icon: AlertCircle, color: "text-rose-600", bgColor: "bg-rose-50", borderColor: "border-rose-200" }
      case "importante":
        return { icon: AlertTriangle, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" }
      default:
        return { icon: Info, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" }
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Puntos de Fricción Detectados</h3>
          <p className="text-sm text-muted-foreground">Componentes que requieren atención</p>
        </div>
        <Badge variant="destructive">{frictionPoints.length} alertas</Badge>
      </div>

      <div className="space-y-4">
        {frictionPoints.map((point) => {
          const config = getSeverityConfig(point.severidad)
          const Icon = config.icon

          return (
            <Card key={point.id} className={cn("p-5 border-l-4", config.borderColor, config.bgColor)}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <Icon className={cn("h-5 w-5 mt-0.5", config.color)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{point.componente_nombre}</h4>
                      <Badge variant="outline" className="text-xs">
                        {point.severidad}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Detectado hace {new Date(point.detectado).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-card rounded-lg border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Estudiantes Impactados</p>
                    <p className="text-lg font-semibold">
                      {point.estudiantes_impactados} de {point.estudiantes_totales}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((point.estudiantes_impactados / point.estudiantes_totales) * 100)}%
                    </p>
                  </div>
                  {point.tasa_abandono > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tasa de Abandono</p>
                      <p className="text-lg font-semibold text-rose-600">{point.tasa_abandono}%</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tiempo Promedio</p>
                    <p className="text-lg font-semibold">{point.tiempo_promedio} min</p>
                    <p className="text-xs text-muted-foreground">vs {point.tiempo_esperado} min esperado</p>
                  </div>
                </div>

                {/* Análisis IA */}
                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Análisis Automático</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{point.analisis_ia}</p>
                </div>

                {/* Sugerencias */}
                <div>
                  <p className="text-sm font-semibold mb-2">Acciones Sugeridas</p>
                  <ul className="space-y-2">
                    {point.sugerencias.map((sugerencia, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                        <span className="flex-1">{sugerencia}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Editar Componente
                  </Button>
                  <Button size="sm" variant="secondary" className="gap-2">
                    <Send className="h-4 w-4" />
                    Enviar Tip a Estudiantes
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-2">
                    <Check className="h-4 w-4" />
                    Marcar como Revisado
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </Card>
  )
}
