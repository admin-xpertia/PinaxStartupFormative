import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

interface ContextBreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function ContextBreadcrumbs({ items, className }: ContextBreadcrumbsProps) {
  return (
    <nav
      className={cn("flex items-center text-sm text-muted-foreground", className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-2">
              {item.onClick ? (
                <button
                  onClick={item.onClick}
                  className={cn(
                    "transition-colors hover:text-foreground",
                    isLast && "font-medium text-foreground cursor-default"
                  )}
                  disabled={isLast}
                  type="button"
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className={cn(
                    isLast && "font-medium text-foreground"
                  )}
                >
                  {item.label}
                </span>
              )}

              {!isLast && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
