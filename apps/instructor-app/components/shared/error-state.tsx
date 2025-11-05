import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  title?: string
  message: string
  retry?: () => void
  className?: string
}

export function ErrorState({ title = "Error al cargar", message, retry, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[400px] text-center", className)}>
      <div className="rounded-full bg-red-50 p-6 mb-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
      {retry && (
        <Button onClick={retry} variant="outline">
          Reintentar
        </Button>
      )}
    </div>
  )
}
