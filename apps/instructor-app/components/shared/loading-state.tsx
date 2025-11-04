import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  variant?: "spinner" | "skeleton" | "overlay"
  text?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingState({ variant = "spinner", text, size = "md", className }: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  if (variant === "spinner") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 py-12", className)}>
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    )
  }

  if (variant === "overlay") {
    return (
      <div
        className={cn(
          "absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
          {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
      </div>
    )
  }

  // Skeleton variant
  return (
    <div className={cn("space-y-3", className)}>
      <div className="h-4 bg-muted animate-pulse rounded" />
      <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
      <div className="h-4 bg-muted animate-pulse rounded w-4/6" />
    </div>
  )
}
