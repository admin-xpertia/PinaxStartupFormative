"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Filter, Layers, Search, Sparkles } from "lucide-react"
import Link from "next/link"
import { exerciseTemplatesApi, exerciseCategoriesMetadata } from "@/services/api/exercises"
import type { ExerciseCategory, ExerciseTemplateResponse } from "@/types/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"

const DEFAULT_CATEGORY = "todos"
type CategoryFilter = ExerciseCategory | typeof DEFAULT_CATEGORY

const CATEGORY_ENTRIES = Object.entries(exerciseCategoriesMetadata) as Array<
  [ExerciseCategory, (typeof exerciseCategoriesMetadata)[ExerciseCategory]]
>

export function TemplateLibrary() {
  const [category, setCategory] = useState<CategoryFilter>(DEFAULT_CATEGORY)
  const [searchTerm, setSearchTerm] = useState("")

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<ExerciseTemplateResponse[]>("exercise-templates", exerciseTemplatesApi.getAll)

  if (error) {
    return (
      <ErrorState
        title="No se pudo cargar la biblioteca"
        message="Ocurrió un error al cargar las plantillas disponibles. Intenta nuevamente en unos segundos."
        retry={() => mutate()}
      />
    )
  }

  const templates = data ?? []
  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredTemplates = useMemo(() => {
    if (!templates.length) return []

    return templates.filter((template) => {
      const matchesCategory = category === DEFAULT_CATEGORY ? true : template.categoria === category

      if (!matchesCategory) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const searchableFields = [
        template.nombre,
        template.descripcion,
        template.objetivoPedagogico,
        exerciseCategoriesMetadata[template.categoria]?.nombre,
      ]

      return searchableFields.some((field) => field?.toLowerCase().includes(normalizedSearch))
    })
  }, [category, normalizedSearch, templates])

  const stats = useMemo(() => {
    if (!templates.length) {
      return { total: 0, official: 0, categories: 0 }
    }

    const official = templates.filter((template) => template.esOficial).length
    const categories = new Set(templates.map((template) => template.categoria)).size

    return {
      total: templates.length,
      official,
      categories,
    }
  }, [templates])

  const highlightedTemplates = filteredTemplates.filter((template) => template.esOficial).slice(0, 3)

  const showLoadingState = isLoading && !templates.length

  const handleResetFilters = () => {
    setCategory(DEFAULT_CATEGORY)
    setSearchTerm("")
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-primary">Biblioteca de ejercicios</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Plantillas disponibles</h1>
            <p className="text-muted-foreground">
              Explora las 10 familias de ejercicios, filtra por categoría y revisa los objetivos pedagógicos
              asociados a cada plantilla oficial.
            </p>
          </div>
          <Button variant="secondary" className="w-full md:w-auto" onClick={() => mutate()}>
            <Sparkles className="mr-2 h-4 w-4" />
            Actualizar biblioteca
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total de plantillas</CardTitle>
            <CardDescription>Catálogo completo disponible para instructores</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total.toString().padStart(2, "0")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plantillas oficiales</CardTitle>
            <CardDescription>Diseños validados por el equipo académico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold">{stats.official.toString().padStart(2, "0")}</p>
              {stats.total > 0 && (
                <Badge variant="outline">
                  {Math.round((stats.official / stats.total) * 100)}% del catálogo
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cobertura por categoría</CardTitle>
            <CardDescription>Distribución frente a las 10 familias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold">{stats.categories}</p>
              <span className="text-sm text-muted-foreground">categorías activas</span>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ENTRIES.map(([key, metadata]) => (
                <Badge key={key} variant={stats.categories && templates.some((t) => t.categoria === key) ? "secondary" : "outline"}>
                  <span className="mr-1" aria-hidden>
                    {metadata.icono}
                  </span>
                  {metadata.nombre}
                </Badge>
              ))}
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nombre, objetivo o categoría"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="hidden h-4 w-4 text-muted-foreground md:block" />
          <Button variant="ghost" disabled={category === DEFAULT_CATEGORY && !searchTerm} onClick={handleResetFilters}>
            Limpiar filtros
          </Button>
        </div>
      </div>

      <Tabs value={category} onValueChange={(value) => setCategory(value as CategoryFilter)}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value={DEFAULT_CATEGORY} className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Todos ({stats.total})
          </TabsTrigger>
          {CATEGORY_ENTRIES.map(([key, metadata]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              <span aria-hidden>{metadata.icono}</span>
              {metadata.nombre}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {showLoadingState ? (
        <Card className="py-12">
          <LoadingState text="Cargando biblioteca de plantillas..." />
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title="No encontramos plantillas"
            description="Intenta ajustar el término de búsqueda o selecciona otra categoría para seguir explorando el catálogo."
            action={{
              label: "Restablecer filtros",
              onClick: handleResetFilters,
            }}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => {
            const metadata = exerciseCategoriesMetadata[template.categoria]
            return (
              <Card key={template.id} className="flex flex-col">
                <CardHeader className="space-y-3">
                  <Badge variant="secondary" className="w-fit" style={{ backgroundColor: `${metadata.color}20` }}>
                    <span className="mr-2" aria-hidden>
                      {metadata.icono}
                    </span>
                    {metadata.nombre}
                  </Badge>
                  <CardTitle>{template.nombre}</CardTitle>
                  <CardDescription>{template.descripcion}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {template.objetivoPedagogico && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Objetivo pedagógico</p>
                      <p className="text-sm">{template.objetivoPedagogico}</p>
                    </div>
                  )}
                  {template.rolIA && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Rol de la IA</p>
                      <p className="text-sm">{template.rolIA}</p>
                    </div>
                  )}
                  {template.configuracionDefault && Object.keys(template.configuracionDefault).length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Variables configurables</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.keys(template.configuracionDefault).map((key) => (
                          <Badge key={key} variant="outline">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {template.esOficial ? (
                      <>
                        <Sparkles className="h-4 w-4 text-primary" />
                        Plantilla oficial
                      </>
                    ) : (
                      <>
                        <Layers className="h-4 w-4" />
                        Beta interna
                      </>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/programas?template=${encodeURIComponent(template.id)}`} className="text-sm font-medium">
                      Configurar
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {highlightedTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Plantillas destacadas</CardTitle>
            <CardDescription>Recomendadas por el equipo pedagógico para esta semana</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {highlightedTemplates.map((template) => (
              <div key={template.id} className="rounded-lg border p-4">
                <p className="text-sm font-semibold">{template.nombre}</p>
                <p className="text-xs text-muted-foreground">{template.descripcion}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  )
}
