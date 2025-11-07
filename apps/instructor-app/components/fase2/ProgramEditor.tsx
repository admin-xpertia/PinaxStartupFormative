"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Program } from "@/types/program"
import { Loader2, X } from "lucide-react"

interface ProgramEditorProps {
  programaId: string
  programaActual: Program
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

export function ProgramEditor({ programaActual, onSave, onCancel }: ProgramEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: programaActual.nombre || "",
    descripcion: programaActual.descripcion || "",
    duracionSemanas: programaActual.duracionSemanas || 12,
    categoria: programaActual.categoria || "",
    nivelDificultad: programaActual.nivelDificultad || "",
    objetivosAprendizaje: programaActual.objetivosAprendizaje || [],
    prerequisitos: programaActual.prerequisitos || [],
    audienciaObjetivo: programaActual.audienciaObjetivo || "",
    tags: programaActual.tags || [],
  })

  // Manejo de arrays como texto (separado por líneas)
  const [objetivosText, setObjetivosText] = useState(
    formData.objetivosAprendizaje.join("\n")
  )
  const [prerequisitosText, setPrerequisitosText] = useState(
    formData.prerequisitos.join("\n")
  )
  const [tagsText, setTagsText] = useState(formData.tags.join(", "))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Convertir textos a arrays
      const objetivosArray = objetivosText
        .split("\n")
        .map((o) => o.trim())
        .filter(Boolean)
      const prerequisitosArray = prerequisitosText
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean)
      const tagsArray = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const updateData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        duracionSemanas: formData.duracionSemanas,
        categoria: formData.categoria || undefined,
        nivelDificultad: formData.nivelDificultad || undefined,
        objetivosAprendizaje: objetivosArray.length > 0 ? objetivosArray : undefined,
        prerequisitos: prerequisitosArray.length > 0 ? prerequisitosArray : undefined,
        audienciaObjetivo: formData.audienciaObjetivo || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      }

      await onSave(updateData)
    } catch (error) {
      console.error("Error in handleSubmit:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Editar Programa</h1>
          <p className="text-muted-foreground mt-2">
            Actualiza la información de tu programa educativo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Datos principales del programa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre del Programa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => updateField("nombre", e.target.value)}
                  required
                  minLength={3}
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => updateField("descripcion", e.target.value)}
                  rows={4}
                />
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => updateField("categoria", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emprendimiento">Emprendimiento</SelectItem>
                    <SelectItem value="innovacion_corporativa">
                      Innovación Corporativa
                    </SelectItem>
                    <SelectItem value="product_management">Product Management</SelectItem>
                    <SelectItem value="design_thinking">Design Thinking</SelectItem>
                    <SelectItem value="tecnologia">Tecnología</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duración */}
              <div className="space-y-2">
                <Label htmlFor="duracionSemanas">
                  Duración (semanas) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="duracionSemanas"
                  type="number"
                  min={1}
                  max={52}
                  value={formData.duracionSemanas}
                  onChange={(e) =>
                    updateField("duracionSemanas", parseInt(e.target.value) || 1)
                  }
                  required
                />
              </div>

              {/* Nivel de Dificultad */}
              <div className="space-y-2">
                <Label htmlFor="nivelDificultad">Nivel de Dificultad</Label>
                <Select
                  value={formData.nivelDificultad}
                  onValueChange={(value) => updateField("nivelDificultad", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principiante">Principiante</SelectItem>
                    <SelectItem value="intermedio">Intermedio</SelectItem>
                    <SelectItem value="avanzado">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Detalles Adicionales */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles Adicionales</CardTitle>
              <CardDescription>
                Información complementaria para estudiantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Objetivos de Aprendizaje */}
              <div className="space-y-2">
                <Label htmlFor="objetivos">Objetivos de Aprendizaje</Label>
                <Textarea
                  id="objetivos"
                  value={objetivosText}
                  onChange={(e) => setObjetivosText(e.target.value)}
                  rows={4}
                  placeholder="Un objetivo por línea&#10;Ejemplo: Dominar HTML y CSS&#10;Ejemplo: Crear aplicaciones con React"
                />
                <p className="text-sm text-muted-foreground">
                  Escribe un objetivo por línea
                </p>
              </div>

              {/* Prerequisitos */}
              <div className="space-y-2">
                <Label htmlFor="prerequisitos">Prerequisitos</Label>
                <Textarea
                  id="prerequisitos"
                  value={prerequisitosText}
                  onChange={(e) => setPrerequisitosText(e.target.value)}
                  rows={3}
                  placeholder="Un prerequisito por línea&#10;Ejemplo: Conocimientos básicos de programación"
                />
                <p className="text-sm text-muted-foreground">
                  Escribe un prerequisito por línea
                </p>
              </div>

              {/* Audiencia Objetivo */}
              <div className="space-y-2">
                <Label htmlFor="audiencia">Audiencia Objetivo</Label>
                <Textarea
                  id="audiencia"
                  value={formData.audienciaObjetivo}
                  onChange={(e) => updateField("audienciaObjetivo", e.target.value)}
                  rows={2}
                  placeholder="Ej: Estudiantes universitarios de carreras técnicas"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="web, frontend, backend, full-stack"
                />
                <p className="text-sm text-muted-foreground">
                  Separa los tags con comas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
