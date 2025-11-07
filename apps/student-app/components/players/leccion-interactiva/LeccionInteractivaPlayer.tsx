"use client"

import { useState } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Video, FileText, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

// Types based on AI-generated content structure
interface LeccionSection {
  tipo: "texto" | "video" | "imagen" | "lista" | "concepto_clave"
  contenido: string
  titulo?: string
  url?: string // for video/image
  items?: string[] // for lists
}

interface QuizQuestion {
  pregunta: string
  tipo: "multiple_choice" | "verdadero_falso" | "checkbox"
  opciones: string[]
  respuesta_correcta: string | string[]
  explicacion?: string
}

interface LeccionContent {
  titulo: string
  objetivos: string[]
  secciones: LeccionSection[]
  conceptos_clave: string[]
  quiz?: QuizQuestion[]
  recursos_adicionales?: Array<{ titulo: string; url: string; tipo: string }>
}

interface LeccionInteractivaPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: LeccionContent
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
}

export function LeccionInteractivaPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  onSave,
  onComplete,
  onExit,
}: LeccionInteractivaPlayerProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set())
  const [quizAnswers, setQuizAnswers] = useState<Record<number, any>>({})
  const [showQuizResults, setShowQuizResults] = useState(false)

  const totalSections = content.secciones.length + (content.quiz ? 1 : 0)
  const isQuizSection = currentSection === content.secciones.length && content.quiz
  const canComplete = completedSections.size >= content.secciones.length

  const handleSectionComplete = () => {
    setCompletedSections(prev => new Set([...prev, currentSection]))
    handleNext()
  }

  const handleNext = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(currentSection + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const handleQuizSubmit = () => {
    setShowQuizResults(true)
    setCompletedSections(prev => new Set([...prev, currentSection]))
  }

  const calculateQuizScore = () => {
    if (!content.quiz) return 0
    let correct = 0
    content.quiz.forEach((q, idx) => {
      const userAnswer = quizAnswers[idx]
      if (Array.isArray(q.respuesta_correcta)) {
        if (JSON.stringify(userAnswer?.sort()) === JSON.stringify(q.respuesta_correcta.sort())) {
          correct++
        }
      } else {
        if (userAnswer === q.respuesta_correcta) {
          correct++
        }
      }
    })
    return Math.round((correct / content.quiz.length) * 100)
  }

  const renderSection = (section: LeccionSection, index: number) => {
    switch (section.tipo) {
      case "texto":
        return (
          <div className="prose prose-lg max-w-none">
            {section.titulo && <h3>{section.titulo}</h3>}
            <p className="text-foreground/90 leading-relaxed">{section.contenido}</p>
          </div>
        )

      case "video":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {section.titulo || "Video"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {section.url ? (
                  <iframe
                    src={section.url}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                ) : (
                  <p className="text-muted-foreground">Video: {section.contenido}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case "imagen":
        return (
          <Card>
            <CardContent className="p-4">
              {section.url ? (
                <img
                  src={section.url}
                  alt={section.titulo || section.contenido}
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Imagen: {section.contenido}</p>
                </div>
              )}
              {section.titulo && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {section.titulo}
                </p>
              )}
            </CardContent>
          </Card>
        )

      case "lista":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{section.titulo || "Puntos Clave"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(section.items || []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )

      case "concepto_clave":
        return (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <BookOpen className="h-5 w-5" />
                Concepto Clave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{section.contenido}</p>
            </CardContent>
          </Card>
        )

      default:
        return <p>{section.contenido}</p>
    }
  }

  const renderQuiz = () => {
    if (!content.quiz) return null

    return (
      <div className="space-y-6">
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-2">Evaluación de Comprensión</h3>
            <p className="text-muted-foreground">
              Responde las siguientes preguntas para verificar tu comprensión de la lección
            </p>
          </CardContent>
        </Card>

        {content.quiz.map((question, qIdx) => (
          <Card key={qIdx}>
            <CardHeader>
              <CardTitle className="text-lg">
                Pregunta {qIdx + 1} de {content.quiz!.length}
              </CardTitle>
              <p className="text-foreground/90">{question.pregunta}</p>
            </CardHeader>
            <CardContent>
              {question.tipo === "multiple_choice" && (
                <RadioGroup
                  value={quizAnswers[qIdx]}
                  onValueChange={(value) =>
                    setQuizAnswers({ ...quizAnswers, [qIdx]: value })
                  }
                  disabled={showQuizResults}
                >
                  {question.opciones.map((option, oIdx) => {
                    const isCorrect = option === question.respuesta_correcta
                    const isSelected = quizAnswers[qIdx] === option
                    return (
                      <div
                        key={oIdx}
                        className={cn(
                          "flex items-center space-x-2 rounded-lg border p-4 transition-colors",
                          showQuizResults &&
                            isCorrect &&
                            "border-green-500 bg-green-50",
                          showQuizResults &&
                            isSelected &&
                            !isCorrect &&
                            "border-red-500 bg-red-50"
                        )}
                      >
                        <RadioGroupItem value={option} id={`q${qIdx}-o${oIdx}`} />
                        <Label
                          htmlFor={`q${qIdx}-o${oIdx}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                        {showQuizResults && isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    )
                  })}
                </RadioGroup>
              )}

              {question.tipo === "checkbox" && (
                <div className="space-y-2">
                  {question.opciones.map((option, oIdx) => {
                    const correctAnswers = question.respuesta_correcta as string[]
                    const isCorrect = correctAnswers.includes(option)
                    const isSelected = quizAnswers[qIdx]?.includes(option)
                    return (
                      <div
                        key={oIdx}
                        className={cn(
                          "flex items-center space-x-2 rounded-lg border p-4",
                          showQuizResults &&
                            isCorrect &&
                            "border-green-500 bg-green-50",
                          showQuizResults &&
                            isSelected &&
                            !isCorrect &&
                            "border-red-500 bg-red-50"
                        )}
                      >
                        <Checkbox
                          id={`q${qIdx}-o${oIdx}`}
                          checked={quizAnswers[qIdx]?.includes(option) || false}
                          onCheckedChange={(checked) => {
                            const current = quizAnswers[qIdx] || []
                            const updated = checked
                              ? [...current, option]
                              : current.filter((o: string) => o !== option)
                            setQuizAnswers({ ...quizAnswers, [qIdx]: updated })
                          }}
                          disabled={showQuizResults}
                        />
                        <Label
                          htmlFor={`q${qIdx}-o${oIdx}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              )}

              {showQuizResults && question.explicacion && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm">
                    <strong>Explicación:</strong> {question.explicacion}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {!showQuizResults && (
          <Button onClick={handleQuizSubmit} size="lg" className="w-full">
            Enviar Respuestas
          </Button>
        )}

        {showQuizResults && (
          <Card className="border-primary">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">
                  Tu puntuación: {calculateQuizScore()}%
                </h3>
                <p className="text-muted-foreground">
                  {calculateQuizScore() >= 70
                    ? "¡Excelente! Has demostrado un buen entendimiento de la lección"
                    : "Revisa los conceptos clave y vuelve a intentarlo"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      exerciseDescription={content.objetivos.join(" • ")}
      proofPointName={proofPointName}
      totalSteps={totalSections}
      currentStep={currentSection + 1}
      onSave={onSave}
      onComplete={onComplete}
      onPrevious={currentSection > 0 ? handlePrevious : undefined}
      onNext={
        currentSection < totalSections - 1 && !isQuizSection ? handleNext : undefined
      }
      onExit={onExit}
      showAIAssistant={true}
    >
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from({ length: totalSections }).map((_, idx) => (
            <Button
              key={idx}
              variant={currentSection === idx ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentSection(idx)}
              className="relative"
            >
              {completedSections.has(idx) && (
                <CheckCircle2 className="h-4 w-4 absolute -top-1 -right-1 text-green-600" />
              )}
              {idx < content.secciones.length ? `Sección ${idx + 1}` : "Quiz"}
            </Button>
          ))}
        </div>

        <Separator />

        {/* Content */}
        {!isQuizSection && content.secciones[currentSection] && (
          <>
            {renderSection(content.secciones[currentSection], currentSection)}
            {!completedSections.has(currentSection) && (
              <Button onClick={handleSectionComplete} className="w-full" size="lg">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Marcar como Completada
              </Button>
            )}
          </>
        )}

        {isQuizSection && renderQuiz()}

        {/* Key Concepts Summary */}
        {!isQuizSection && content.conceptos_clave && content.conceptos_clave.length > 0 && (
          <Card className="mt-8 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle>Conceptos Clave de Esta Lección</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {content.conceptos_clave.map((concepto, idx) => (
                  <Badge key={idx} variant="secondary" className="text-sm">
                    {concepto}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ExercisePlayer>
  )
}
