"use client"

import { useState } from "react"
import {
  X,
  Sparkles,
  BookOpen,
  Layers,
  Target,
  GraduationCap,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Clock,
  Cpu,
  DollarSign,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import type { GenerationConfig, TipoComponente } from "@/types/content"

interface ContentGenerationWizardProps {
  isOpen: boolean
  onClose: () => void
  tipoComponente: TipoComponente
  nombreComponente: string
  contexto: {
    programa: string
    fase: string
    proofPoint: string
    preguntaCentral: string
    nivel: string
    objetivoNivel: string
  }
  onGenerate: (config: GenerationConfig) => void
}

export function ContentGenerationWizard({
  isOpen,
  onClose,
  tipoComponente,
  nombreComponente,
  contexto,
  onGenerate,
}: ContentGenerationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [config, setConfig] = useState<Partial<GenerationConfig>>({
    tipo_componente: tipoComponente,
    nombre_componente: nombreComponente,
    programa_nombre: contexto.programa,
    fase_nombre: contexto.fase,
    proof_point_nombre: contexto.proofPoint,
    proof_point_pregunta: contexto.preguntaCentral,
    nivel_nombre: contexto.nivel,
    nivel_objetivo: contexto.objetivoNivel,
    conceptos_enfatizar: [],
    casos_incluir: [],
    nivel_profundidad: 3,
    estilo_narrativo: "conversacional",
    duracion_target: 20,
    elementos_incluir: ["ejemplos", "actividades", "reflexiones"],
    modelo_ia: "gpt4o",
    temperatura: 0.7,
    usar_few_shot: true,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [showPrompt, setShowPrompt] = useState(false)

  if (!isOpen) return null

  const steps = [
    { numero: 1, label: "Contexto" },
    { numero: 2, label: "Configuración" },
    { numero: 3, label: "Generación" },
  ]

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    setGenerationStep(1)

    // Simular progreso de generación
    setTimeout(() => setGenerationStep(2), 2000)
    setTimeout(() => setGenerationStep(3), 5000)
    setTimeout(() => {
      setIsGenerating(false)
      onGenerate(config as GenerationConfig)
    }, 7000)
  }

  const generationSteps = [
    { label: "Procesando contexto...", estimado: "5s" },
    { label: "Generando contenido...", estimado: "30s" },
    { label: "Validando calidad...", estimado: "10s" },
  ]

  const mockPrompt = `# CONTEXTO
Eres un diseñador instruccional experto creando contenido para Xpertia Platform.

## Programa
Nombre: ${contexto.programa}

## Fase Actual
Nombre: ${contexto.fase}

## Proof Point
Nombre: ${contexto.proofPoint}
Pregunta Central: ${contexto.preguntaCentral}

## Nivel
Nombre: ${contexto.nivel}
Objetivo Específico: ${contexto.objetivoNivel}

# TAREA
Genera una ${tipoComponente} con las siguientes características:

- Tipo: ${tipoComponente}
- Nombre: ${nombreComponente}
- Duración objetivo: ${config.duracion_target} minutos
- Nivel de profundidad: ${config.nivel_profundidad}
- Estilo narrativo: ${config.estilo_narrativo}

# FORMATO DE OUTPUT
Retorna en formato JSON estructurado con contenido y metadata.`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold">
                  Generar {tipoComponente.charAt(0).toUpperCase() + tipoComponente.slice(1)} con IA
                </h2>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Asistido por IA
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {nombreComponente} - {contexto.proofPoint} - {contexto.fase}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {steps.map((step, index) => (
              <div key={step.numero} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step.numero === currentStep
                        ? "bg-primary text-primary-foreground"
                        : step.numero < currentStep
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.numero < currentStep ? <CheckCircle className="w-5 h-5" /> : step.numero}
                  </div>
                  <span className="text-xs mt-1 font-medium">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${step.numero < currentStep ? "bg-success" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Contexto de Generación</h3>
                <p className="text-sm text-muted-foreground">
                  Revisemos el contexto que la IA usará para generar contenido
                </p>
              </div>

              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold">Contexto Automático</h4>
                  <Badge variant="secondary" className="text-xs">
                    Auto-recopilado
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Programa</div>
                      <div className="text-sm text-muted-foreground">{contexto.programa}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Layers className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Fase</div>
                      <div className="text-sm text-muted-foreground">{contexto.fase}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Proof Point</div>
                      <div className="text-sm text-muted-foreground">{contexto.proofPoint}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Pregunta central: {contexto.preguntaCentral}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Nivel</div>
                      <div className="text-sm text-muted-foreground">{contexto.nivel}</div>
                      <div className="text-xs text-muted-foreground mt-1">Objetivo: {contexto.objetivoNivel}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileCheck className="w-4 h-4 mt-0.5 text-success" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Documentación de Fase</div>
                      <div className="text-sm text-success">Completa</div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="instrucciones">Instrucciones Específicas (Opcional)</Label>
                  <Textarea
                    id="instrucciones"
                    placeholder="Ej: Enfócate en casos del sector healthcare, incluye ejemplos de startups chilenas, evita jerga técnica excesiva..."
                    rows={4}
                    className="mt-2"
                    value={config.instrucciones_adicionales || ""}
                    onChange={(e) => setConfig({ ...config, instrucciones_adicionales: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cualquier instrucción específica que quieras que la IA considere
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Configuración de Generación</h3>
                <p className="text-sm text-muted-foreground">Ajusta los parámetros para personalizar el contenido</p>
              </div>

              {tipoComponente === "leccion" && (
                <div className="space-y-6">
                  <div>
                    <Label>Nivel de Profundidad</Label>
                    <div className="mt-4">
                      <Slider
                        value={[config.nivel_profundidad || 3]}
                        onValueChange={(value) => setConfig({ ...config, nivel_profundidad: value[0] })}
                        min={1}
                        max={5}
                        step={1}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Introductorio</span>
                        <span>Intermedio</span>
                        <span>Avanzado</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Controla la complejidad conceptual y técnica</p>
                  </div>

                  <div>
                    <Label>Estilo Narrativo</Label>
                    <Select
                      value={config.estilo_narrativo}
                      onValueChange={(value) => setConfig({ ...config, estilo_narrativo: value as any })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academico">
                          <div>
                            <div className="font-medium">Académico</div>
                            <div className="text-xs text-muted-foreground">
                              Formal, con referencias y terminología precisa
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="conversacional">
                          <div>
                            <div className="font-medium">Conversacional</div>
                            <div className="text-xs text-muted-foreground">
                              Cercano, usa preguntas retóricas y analogías
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="narrativo">
                          <div>
                            <div className="font-medium">Narrativo</div>
                            <div className="text-xs text-muted-foreground">
                              Cuenta historias, usa ejemplos como hilo conductor
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="socratico">
                          <div>
                            <div className="font-medium">Socrático</div>
                            <div className="text-xs text-muted-foreground">
                              Plantea preguntas que guían al descubrimiento
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Duración Objetivo (minutos)</Label>
                    <div className="mt-4">
                      <Slider
                        value={[config.duracion_target || 20]}
                        onValueChange={(value) => setConfig({ ...config, duracion_target: value[0] })}
                        min={5}
                        max={60}
                        step={5}
                        className="mb-2"
                      />
                      <div className="text-center text-sm font-medium">{config.duracion_target} minutos</div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      La IA generará contenido para esta duración de lectura
                    </p>
                  </div>

                  <div>
                    <Label>Elementos a Incluir</Label>
                    <div className="space-y-2 mt-2">
                      {["ejemplos", "actividades", "reflexiones", "recursos"].map((elemento) => (
                        <div key={elemento} className="flex items-center space-x-2">
                          <Checkbox
                            id={elemento}
                            checked={config.elementos_incluir?.includes(elemento)}
                            onCheckedChange={(checked) => {
                              const current = config.elementos_incluir || []
                              setConfig({
                                ...config,
                                elementos_incluir: checked
                                  ? [...current, elemento]
                                  : current.filter((e) => e !== elemento),
                              })
                            }}
                          />
                          <label htmlFor={elemento} className="text-sm capitalize cursor-pointer">
                            {elemento === "ejemplos" && "Ejemplos Prácticos"}
                            {elemento === "actividades" && "Actividades Embebidas"}
                            {elemento === "reflexiones" && "Preguntas de Reflexión"}
                            {elemento === "recursos" && "Recursos Adicionales"}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tipoComponente === "cuaderno" && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="secciones">Número de Secciones</Label>
                    <Input
                      id="secciones"
                      type="number"
                      min={1}
                      max={10}
                      value={config.numero_secciones || 3}
                      onChange={(e) => setConfig({ ...config, numero_secciones: Number.parseInt(e.target.value) })}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Secciones temáticas del cuaderno</p>
                  </div>

                  <div>
                    <Label>Tipos de Preguntas a Incluir</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        { value: "reflexion", label: "Reflexión", desc: "Introspección personal" },
                        { value: "aplicacion", label: "Aplicación", desc: "Aplicar conceptos a su proyecto" },
                        { value: "analisis", label: "Análisis", desc: "Evaluar situaciones o casos" },
                        { value: "sintesis", label: "Síntesis", desc: "Integrar múltiples conceptos" },
                      ].map((tipo) => (
                        <div key={tipo.value} className="flex items-start space-x-2">
                          <Checkbox
                            id={tipo.value}
                            checked={config.tipos_pregunta?.includes(tipo.value as any)}
                            onCheckedChange={(checked) => {
                              const current = config.tipos_pregunta || []
                              setConfig({
                                ...config,
                                tipos_pregunta: checked
                                  ? [...current, tipo.value as any]
                                  : current.filter((t) => t !== tipo.value),
                              })
                            }}
                          />
                          <div className="cursor-pointer" onClick={() => document.getElementById(tipo.value)?.click()}>
                            <div className="text-sm font-medium">{tipo.label}</div>
                            <div className="text-xs text-muted-foreground">{tipo.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ejemplos-respuesta"
                      checked={config.incluir_ejemplos_respuesta}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, incluir_ejemplos_respuesta: checked as boolean })
                      }
                    />
                    <div>
                      <label htmlFor="ejemplos-respuesta" className="text-sm font-medium cursor-pointer">
                        Generar Ejemplos de Respuestas Fuertes
                      </label>
                      <p className="text-xs text-muted-foreground">Para calibrar el sistema de evaluación</p>
                    </div>
                  </div>
                </div>
              )}

              {tipoComponente === "simulacion" && (
                <div className="space-y-6">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-4">Configuración del Personaje</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nombre-personaje">Nombre del Personaje</Label>
                        <Input
                          id="nombre-personaje"
                          placeholder="Ej: Laura Martínez, Diego Chen"
                          className="mt-2"
                          value={config.personaje?.nombre || ""}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              personaje: { ...config.personaje, nombre: e.target.value } as any,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="rol-personaje">Rol/Profesión</Label>
                        <Input
                          id="rol-personaje"
                          placeholder="Ej: Fundadora de startup B2B SaaS"
                          className="mt-2"
                          value={config.personaje?.rol || ""}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              personaje: { ...config.personaje, rol: e.target.value } as any,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="background-personaje">Background</Label>
                        <Textarea
                          id="background-personaje"
                          placeholder="Historia, experiencia, contexto..."
                          rows={3}
                          className="mt-2"
                          value={config.personaje?.background || ""}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              personaje: { ...config.personaje, background: e.target.value } as any,
                            })
                          }
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Generar Contenido</h3>
                <p className="text-sm text-muted-foreground">Revisa el prompt y ejecuta la generación</p>
              </div>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Prompt que se Enviará a la IA</h4>
                  <Button variant="ghost" size="sm" onClick={() => setShowPrompt(!showPrompt)}>
                    {showPrompt ? "Ocultar" : "Ver Prompt"}
                  </Button>
                </div>
                {showPrompt && (
                  <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{mockPrompt}</pre>
                  </div>
                )}
              </Card>

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Tiempo Estimado</span>
                  </div>
                  <div className="text-sm font-semibold">30-45 segundos</div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Cpu className="w-4 h-4" />
                    <span className="text-xs">Tokens Aproximados</span>
                  </div>
                  <div className="text-sm font-semibold">~2,500 tokens</div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs">Costo Estimado</span>
                  </div>
                  <div className="text-sm font-semibold">$0.15</div>
                </Card>
              </div>

              {isGenerating && (
                <Card className="p-6 bg-purple-50 border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                    <span className="font-medium text-purple-900">La IA está generando tu contenido...</span>
                  </div>
                  <div className="space-y-3">
                    {generationSteps.map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            index < generationStep
                              ? "bg-success text-success-foreground"
                              : index === generationStep
                                ? "bg-primary text-primary-foreground animate-pulse"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index < generationStep ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm">{step.label}</div>
                          <div className="text-xs text-muted-foreground">{step.estimado}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(generationStep / generationSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button variant="secondary" onClick={handlePrevious} disabled={isGenerating}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
            {currentStep < 3 && (
              <Button onClick={handleNext}>
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {currentStep === 3 && !isGenerating && (
              <Button onClick={handleGenerate} className="bg-primary">
                <Sparkles className="w-4 h-4 mr-2" />
                Generar
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
