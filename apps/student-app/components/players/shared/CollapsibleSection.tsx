"use client"

import { useState, ReactNode } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CollapsibleSectionProps {
  id: string
  title: string
  subtitle?: string
  defaultOpen?: boolean
  sticky?: boolean
  children: ReactNode
  onToggle?: (isOpen: boolean) => void
}

export function CollapsibleSection({
  id,
  title,
  subtitle,
  defaultOpen = true,
  sticky = false,
  children,
  onToggle,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }

  return (
    <div id={id} className="border rounded-lg overflow-hidden mb-4">
      {/* Header - Sticky when specified */}
      <button
        onClick={handleToggle}
        className={cn(
          "w-full px-6 py-4 bg-muted/30 hover:bg-muted/50 transition-colors",
          "flex items-center justify-between",
          sticky && "sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-muted/60"
        )}
      >
        <div className="flex-1 text-left">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-6 border-t">
          {children}
        </div>
      )}
    </div>
  )
}
