"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ExerciseCategory, ExerciseTemplateResponse } from "@/types/api"

interface ExerciseTypeCardProps {
  categoria: ExerciseCategory
  metadata: {
    nombre: string
    icono: string
    color: string
    descripcionCorta: string
  }
  template?: ExerciseTemplateResponse
  onSelect: () => void
}

export function ExerciseTypeCard({ categoria, metadata, template, onSelect }: ExerciseTypeCardProps) {
  const isAvailable = !!template

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isAvailable ? "hover:border-primary/50" : "opacity-50 cursor-not-allowed",
        "border-t-4"
      )}
      style={{
        borderTopColor: metadata.color,
      }}
      onClick={() => isAvailable && onSelect()}
    >
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-start justify-between mb-2">
          <span className="text-3xl">{metadata.icono}</span>
          {template?.esOficial && (
            <Badge variant="secondary" className="text-xs">
              Oficial
            </Badge>
          )}
        </div>
        <CardTitle className="text-sm leading-tight">{metadata.nombre}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-xs line-clamp-3">
          {metadata.descripcionCorta}
        </CardDescription>
        {!isAvailable && (
          <p className="text-xs text-muted-foreground mt-2">No disponible</p>
        )}
      </CardContent>
    </Card>
  )
}
