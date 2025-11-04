import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react"
import type { QualitativeTheme, Misconception } from "@/types/analytics"

interface QualitativeAnalysisProps {
  themes: QualitativeTheme[]
  misconceptions: Misconception[]
}

export function QualitativeAnalysis({ themes, misconceptions }: QualitativeAnalysisProps) {
  const getSentimentEmoji = (sentimiento: string) => {
    switch (sentimiento) {
      case "positivo":
        return "😊"
      case "negativo":
        return "😟"
      default:
        return "😐"
    }
  }

  return (
    <div className="space-y-6">
      {/* Temas Emergentes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Temas Emergentes</h3>
        <p className="text-sm text-muted-foreground mb-6">Temas y conceptos mencionados frecuentemente en respuestas</p>

        <div className="space-y-3">
          {themes.map((theme, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{theme.tema}</span>
                  <span className="text-lg">{getSentimentEmoji(theme.sentimiento)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(theme.frecuencia / 25) * 100}%` }}
                  />
                </div>
                <Badge variant="secondary">{theme.frecuencia}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Conceptos Erróneos */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Conceptos Erróneos Detectados</h3>
            <p className="text-sm text-muted-foreground">Patrones de malentendidos identificados por IA</p>
          </div>
          <Badge variant="destructive">{misconceptions.length} patrones</Badge>
        </div>

        <div className="space-y-4">
          {misconceptions.map((misconception, idx) => (
            <Card key={idx} className="p-5 border-l-4 border-amber-500 bg-amber-50">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{misconception.concepto}</h4>
                    <p className="text-sm text-muted-foreground">
                      {misconception.frecuencia} estudiantes ({Math.round((misconception.frecuencia / 15) * 100)}% del
                      total)
                    </p>
                  </div>
                </div>

                {/* Descripción */}
                <p className="text-sm">{misconception.descripcion}</p>

                {/* Ejemplos */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Ejemplos de respuestas:</p>
                  {misconception.ejemplos.map((ejemplo, eIdx) => (
                    <div key={eIdx} className="p-3 bg-card rounded border text-sm">
                      <p className="italic text-muted-foreground">"{ejemplo.texto}"</p>
                      <p className="text-xs text-muted-foreground mt-1">— {ejemplo.estudiante}</p>
                    </div>
                  ))}
                </div>

                {/* Impacto */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-card rounded-lg border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Score Promedio (Afectados)</p>
                    <p className="text-2xl font-bold text-rose-600">
                      {misconception.impacto.score_promedio_afectados}/10
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Score Promedio (No Afectados)</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {misconception.impacto.score_promedio_no_afectados}/10
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="default">
                    Insertar Aclaración
                  </Button>
                  <Button size="sm" variant="secondary">
                    Generar Ejemplo con IA
                  </Button>
                  <Button size="sm" variant="outline">
                    Enviar Tip a Afectados
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Insights Destacados */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Insights Inesperados</h3>
        <p className="text-sm text-muted-foreground mb-6">Patrones interesantes detectados por IA</p>

        <div className="space-y-4">
          <Card className="p-4 border-l-4 border-primary bg-primary/5">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Aplicación creativa del framework</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  5 estudiantes están aplicando el framework de Jobs-to-be-Done no solo a productos digitales, sino
                  también a servicios físicos. Esto no estaba contemplado en ejemplos originales pero muestra
                  comprensión profunda.
                </p>
                <Badge>Alta relevancia</Badge>
                <Button size="sm" variant="link" className="p-0 h-auto mt-2">
                  Considerar agregar estos casos como ejemplos →
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-blue-500 bg-blue-50">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Contexto cultural influye en interpretación</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Estudiantes de América Latina mencionan consistentemente la 'informalidad del mercado' como factor en
                  validación, mientras que no aparece en respuestas de estudiantes de otros contextos.
                </p>
                <Badge variant="secondary">Media relevancia</Badge>
                <Button size="sm" variant="link" className="p-0 h-auto mt-2">
                  Considerar versión localizada del contenido →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  )
}
