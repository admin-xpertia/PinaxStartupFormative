"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import type { Program } from "@/types/program"
import { ArrowRight, BarChart3, Edit, Eye, MoreVertical, AlertCircle, Layers, Target, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface ProgramCardProps {
  program: Program
}

export function ProgramCard({ program }: ProgramCardProps) {
  const router = useRouter()
  const isPublished = program.estado === "publicado"
  const isDraft = program.estado === "borrador"
  const isArchived = program.estado === "archivado"

  const badgeVariant = isPublished ? "default" : "secondary"
  const badgeText = isPublished ? "Publicado" : isDraft ? "Borrador" : "Archivado"
  const borderColor = isPublished ? "border-l-success" : isDraft ? "border-l-warning" : "border-l-muted"

  const handleOpenProgram = () => {
    router.push(`/programas/${program.id}`)
  }

  const handleContinueEditing = () => {
    router.push(`/programas/${program.id}/estructura`)
  }

  const handleViewAnalytics = () => {
    router.push(`/programas/${program.id}/analytics`)
  }

  return (
    <Card className={cn("transition-all hover:shadow-md hover:border-primary/20", "border-l-4", borderColor)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-lg leading-tight">{program.nombre}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{program.descripcion}</p>
          </div>
          <Badge
            variant={badgeVariant}
            className={cn(
              isPublished && "bg-success text-success-foreground",
              isDraft && "bg-warning text-warning-foreground",
            )}
          >
            {badgeText}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistics Grid */}
        {program.estadisticas && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{program.estadisticas.fases}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{program.estadisticas.proof_points}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{program.estadisticas.duracion}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{program.estadisticas.estudiantes}</span>
            </div>
          </div>
        )}

        {/* Progress Bar for Drafts */}
        {isDraft && program.progreso_creacion !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progreso de creación</span>
              <span className="font-medium">{program.progreso_creacion}%</span>
            </div>
            <Progress value={program.progreso_creacion} className="h-2" />
          </div>
        )}

        {/* Alert */}
        {program.alerta && (
          <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
            <p className="text-xs text-warning-foreground">{program.alerta.texto}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          {new Date(program.updatedAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </p>
        <div className="flex items-center gap-2">
          {isPublished ? (
            <>
              <Button size="sm" onClick={handleOpenProgram}>
                Abrir Programa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleViewAnalytics}>
                <BarChart3 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={handleContinueEditing}>
              <Edit className="mr-2 h-4 w-4" />
              Continuar Editando
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPublished && <DropdownMenuItem>Editar</DropdownMenuItem>}
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              {isPublished && <DropdownMenuItem>Exportar</DropdownMenuItem>}
              <DropdownMenuItem className="text-destructive">
                {isPublished ? "Archivar" : "Eliminar Borrador"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  )
}
