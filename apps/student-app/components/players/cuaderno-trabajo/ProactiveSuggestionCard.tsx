import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProactiveSuggestionCardProps {
  isAnalyzing?: boolean
  suggestion?: string | null
  className?: string
}

export function ProactiveSuggestionCard({
  isAnalyzing,
  suggestion,
  className,
}: ProactiveSuggestionCardProps) {
  if (!isAnalyzing && !suggestion) {
    return null
  }

  if (isAnalyzing) {
    return (
      <Card className={cn("bg-blue-50 border-blue-200", className)}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analizando tu respuesta...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!suggestion) {
    return null
  }

  return (
    <Card className={cn("bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <h4 className="text-sm font-semibold text-purple-900">
              Sugerencia del Tutor IA
            </h4>
            <p className="text-sm text-purple-800 leading-relaxed">
              {suggestion}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
