"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProgramFormData } from "@/types/wizard"

interface Step1Props {
  data: ProgramFormData
  onUpdate: (data: Partial<ProgramFormData>) => void
}

export function Step1BasicInfo({ data, onUpdate }: Step1Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Información Básica del Programa</h2>
        <p className="mt-2 text-base text-muted-foreground">
          Define los aspectos fundamentales de tu experiencia de aprendizaje
        </p>
      </div>

      <div className="space-y-6">
        {/* Nombre del Programa */}
        <div className="space-y-2">
          <Label htmlFor="nombre_programa">
            Nombre del Programa <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nombre_programa"
            placeholder="Ej: Xpertia Emprendedor, Corporate Innovation Sprint"
            value={data.nombre_programa}
            onChange={(e) => onUpdate({ nombre_programa: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">Nombre descriptivo que estudiantes verán</p>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="descripcion">
            Descripción del Programa <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="descripcion"
            placeholder="Describe qué aprenderán los estudiantes y qué problemas resolverán..."
            rows={4}
            value={data.descripcion}
            onChange={(e) => onUpdate({ descripcion: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">Esta descripción aparecerá en la vista de estudiantes</p>
        </div>

        {/* Categoría */}
        <div className="space-y-2">
          <Label htmlFor="categoria">
            Categoría <span className="text-destructive">*</span>
          </Label>
          <Select value={data.categoria} onValueChange={(value) => onUpdate({ categoria: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emprendimiento">Emprendimiento</SelectItem>
              <SelectItem value="innovacion_corporativa">Innovación Corporativa</SelectItem>
              <SelectItem value="product_management">Product Management</SelectItem>
              <SelectItem value="design_thinking">Design Thinking</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Duración */}
        <div className="space-y-2">
          <Label htmlFor="duracion_semanas">
            Duración Estimada (semanas) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="duracion_semanas"
            type="number"
            min={1}
            max={52}
            placeholder="12"
            value={data.duracion_semanas}
            onChange={(e) => onUpdate({ duracion_semanas: Number.parseInt(e.target.value) || 0 })}
          />
          <p className="text-sm text-muted-foreground">Tiempo estimado que tomará completar todo el programa</p>
        </div>

        {/* Número de Fases */}
        <div className="space-y-2">
          <Label htmlFor="numero_fases">
            Número de Fases <span className="text-destructive">*</span>
          </Label>
          <Input
            id="numero_fases"
            type="number"
            min={1}
            max={8}
            placeholder="4"
            value={data.numero_fases}
            onChange={(e) => onUpdate({ numero_fases: Number.parseInt(e.target.value) || 0 })}
          />
          <p className="text-sm text-muted-foreground">Las fases son agrupaciones temáticas de proof points</p>
          <div className="rounded-lg bg-accent/10 p-3 text-sm text-accent-foreground">
            💡 Recomendamos 4 fases para programas completos
          </div>
        </div>
      </div>
    </div>
  )
}
