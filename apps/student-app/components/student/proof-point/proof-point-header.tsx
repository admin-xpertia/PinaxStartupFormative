import { ChevronLeft, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface ProofPointHeaderProps {
  title: string
  subtitle?: string
  progress: number
  onBack: () => void
}

export function ProofPointHeader({ title, subtitle, progress, onBack }: ProofPointHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
            Volver al Dashboard
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Progreso</span>
          <Progress value={progress} className="h-2 w-32" />
          <span className="font-semibold">{progress}%</span>
        </div>
      </div>
    </header>
  )
}
