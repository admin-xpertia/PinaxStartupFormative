"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Sparkles, Edit, Rocket } from "lucide-react"

interface ProgramActionBarProps {
  isPublished: boolean
  proofPointsCount: number
  isRefreshingAnalytics: boolean
  onRefreshAnalytics: () => void
  onOpenAssistant: () => void
  onPublishProgram: () => Promise<void> | void
  publishing: boolean
  programId: string
}

export function ProgramActionBar({
  isPublished,
  proofPointsCount,
  isRefreshingAnalytics,
  onRefreshAnalytics,
  onOpenAssistant,
  onPublishProgram,
  publishing,
  programId,
}: ProgramActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={isPublished ? "default" : "secondary"}>
        {isPublished ? "Publicado" : "Borrador"}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefreshAnalytics}
        disabled={isRefreshingAnalytics}
      >
        {isRefreshingAnalytics ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        Actualizar datos
      </Button>
      {proofPointsCount > 0 && (
        <Button variant="outline" size="sm" onClick={onOpenAssistant}>
          <Sparkles className="mr-2 h-4 w-4" />
          Asistente de Ejercicios IA
        </Button>
      )}
      <Button variant="outline" size="sm" asChild>
        <Link href={`/programas/${programId}/estructura`}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Estructura
        </Link>
      </Button>
      {!isPublished && (
        <Button size="sm" onClick={onPublishProgram} disabled={publishing}>
          {publishing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="mr-2 h-4 w-4" />
          )}
          Publicar Programa
        </Button>
      )}
    </div>
  )
}
