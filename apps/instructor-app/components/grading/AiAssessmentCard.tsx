"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Bot, Sparkles } from "lucide-react"

interface AiAssessmentCardProps {
  aiScore?: number | null
  feedback?: Record<string, any> | null
}

export function AiAssessmentCard({ aiScore, feedback }: AiAssessmentCardProps) {
  const strengths = Array.isArray(feedback?.strengths) ? feedback!.strengths : []
  const improvements = Array.isArray(feedback?.improvements) ? feedback!.improvements : []
  const summary = feedback?.summary || feedback?.suggestion || null
  const rubricItems = Array.isArray(feedback?.criteria)
    ? (feedback!.criteria as Array<{ name?: string; score?: number; comments?: string }>)
    : []

  return (
    <Card className="h-full rounded-2xl border bg-card shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Sugerencia de IA</CardTitle>
            <p className="text-xs text-muted-foreground">Resumen generado automáticamente para esta entrega.</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Bot className="h-3.5 w-3.5" />
            AI
          </Badge>
        </div>
        <div className="flex items-baseline gap-2 pt-4">
          <span className="text-4xl font-semibold">{typeof aiScore === "number" ? Math.round(aiScore) : "--"}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
        {summary ? (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Resumen principal
            </div>
            <p className="mt-2">{summary}</p>
          </div>
        ) : null}

        {strengths.length === 0 && improvements.length === 0 && rubricItems.length === 0 && !summary ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Aún no hay feedback generado para esta entrega.
          </div>
        ) : (
          <Accordion type="multiple" className="rounded-lg border">
            {strengths.length > 0 && (
              <AccordionItem value="strengths">
                <AccordionTrigger className="px-4 py-3 text-sm font-medium">
                  Fortalezas detectadas ({strengths.length})
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    {strengths.map((item, idx) => (
                      <li key={`strength-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            {improvements.length > 0 && (
              <AccordionItem value="improvements">
                <AccordionTrigger className="px-4 py-3 text-sm font-medium">
                  Áreas de mejora ({improvements.length})
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    {improvements.map((item, idx) => (
                      <li key={`improvement-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            {rubricItems.length > 0 && (
              <AccordionItem value="rubric">
                <AccordionTrigger className="px-4 py-3 text-sm font-medium">
                  Evaluación por criterios
                </AccordionTrigger>
                <AccordionContent className="bg-muted/20 px-4 pb-4">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    {rubricItems.map((criterion, idx) => (
                      <div key={`criterion-${idx}`} className="rounded-lg border bg-background p-3">
                        <div className="flex items-center justify-between text-foreground">
                          <p className="font-semibold">{criterion.name || `Criterio ${idx + 1}`}</p>
                          {typeof criterion.score === "number" ? (
                            <Badge variant="secondary">{criterion.score}/100</Badge>
                          ) : null}
                        </div>
                        {criterion.comments ? (
                          <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">
                            {criterion.comments}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}

        {feedback?.nextSteps ? (
          <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
            <p className="font-semibold">Siguientes pasos sugeridos</p>
            <p className="text-muted-foreground">{feedback.nextSteps}</p>
          </div>
        ) : null}

        {feedback?.rubricAlignment !== undefined ? (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Alineación con la rúbrica</p>
            <Separator className="my-2" />
            <p>{feedback.rubricAlignment}% de alineación con los criterios definidos.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
