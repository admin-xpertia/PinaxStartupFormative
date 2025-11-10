"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { CheckCircle2, XCircle, Lightbulb, RefreshCcw, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export type QuestionType = 'multiple_choice' | 'multiple_select' | 'open_ended'

export interface QuestionOption {
  id: string
  text: string
  isCorrect?: boolean
}

export interface EmbeddedQuestionProps {
  id: string
  question: string
  type: QuestionType
  options?: QuestionOption[]
  correctAnswer?: string | string[]
  explanation?: string
  hint?: string
  onAnswer?: (answer: any, isCorrect: boolean) => void
  onDiscuss?: (question: string) => void
}

export function EmbeddedQuestion({
  id,
  question,
  type,
  options = [],
  correctAnswer,
  explanation,
  hint,
  onAnswer,
  onDiscuss,
}: EmbeddedQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [openAnswer, setOpenAnswer] = useState("")

  const handleCheck = () => {
    let isCorrect = false

    if (type === 'multiple_choice' && typeof correctAnswer === 'string') {
      isCorrect = selectedAnswer === correctAnswer
    } else if (type === 'multiple_select' && Array.isArray(correctAnswer)) {
      const selected = Array.isArray(selectedAnswer) ? selectedAnswer : []
      isCorrect =
        selected.length === correctAnswer.length &&
        selected.every(ans => correctAnswer.includes(ans))
    } else if (type === 'open_ended') {
      // For open-ended, we'll just show the explanation
      isCorrect = true // or implement AI-based checking
    }

    setShowFeedback(true)
    onAnswer?.(selectedAnswer || openAnswer, isCorrect)
  }

  const handleReset = () => {
    setSelectedAnswer(null)
    setOpenAnswer("")
    setShowFeedback(false)
  }

  const handleDiscuss = () => {
    onDiscuss?.(question)
  }

  const isAnswered =
    (type === 'open_ended' && openAnswer.length > 0) ||
    (type !== 'open_ended' && selectedAnswer !== null)

  const getSelectedOption = () => {
    if (type === 'multiple_choice' && typeof selectedAnswer === 'string') {
      return options.find(opt => opt.id === selectedAnswer)
    }
    return null
  }

  const isCorrectAnswer = () => {
    if (type === 'multiple_choice') {
      return selectedAnswer === correctAnswer
    }
    if (type === 'multiple_select' && Array.isArray(correctAnswer)) {
      const selected = Array.isArray(selectedAnswer) ? selectedAnswer : []
      return (
        selected.length === correctAnswer.length &&
        selected.every(ans => correctAnswer.includes(ans))
      )
    }
    return false
  }

  return (
    <Card className={cn(
      "my-6 p-6",
      showFeedback && isCorrectAnswer() && "border-green-500 bg-green-50/50",
      showFeedback && !isCorrectAnswer() && type !== 'open_ended' && "border-red-500 bg-red-50/50"
    )}>
      <div className="border-l-4 border-cyan-500 pl-4 mb-4">
        <p className="font-semibold text-lg mb-2">{question}</p>
        {hint && !showFeedback && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
            <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{hint}</p>
          </div>
        )}
      </div>

      {/* Multiple Choice */}
      {type === 'multiple_choice' && (
        <RadioGroup
          value={selectedAnswer as string}
          onValueChange={(value) => setSelectedAnswer(value)}
          disabled={showFeedback}
          className="space-y-3"
        >
          {options.map((option) => {
            const isSelected = selectedAnswer === option.id
            const isCorrectOption = option.id === correctAnswer
            const showCorrect = showFeedback && isCorrectOption
            const showWrong = showFeedback && isSelected && !isCorrectOption

            return (
              <div
                key={option.id}
                className={cn(
                  "flex items-center space-x-2 rounded-lg border p-4 transition-colors",
                  showCorrect && "border-green-500 bg-green-50",
                  showWrong && "border-red-500 bg-red-50",
                  !showFeedback && "hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value={option.id} id={`${id}-${option.id}`} />
                <Label htmlFor={`${id}-${option.id}`} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
                {showCorrect && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {showWrong && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            )
          })}
        </RadioGroup>
      )}

      {/* Multiple Select */}
      {type === 'multiple_select' && (
        <div className="space-y-3">
          {options.map((option) => {
            const isSelected = Array.isArray(selectedAnswer) && selectedAnswer.includes(option.id)
            const isCorrectOption = Array.isArray(correctAnswer) && correctAnswer.includes(option.id)
            const showCorrect = showFeedback && isCorrectOption
            const showWrong = showFeedback && isSelected && !isCorrectOption

            return (
              <div
                key={option.id}
                className={cn(
                  "flex items-center space-x-2 rounded-lg border p-4",
                  showCorrect && "border-green-500 bg-green-50",
                  showWrong && "border-red-500 bg-red-50"
                )}
              >
                <Checkbox
                  id={`${id}-${option.id}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => {
                    const current = Array.isArray(selectedAnswer) ? selectedAnswer : []
                    if (checked) {
                      setSelectedAnswer([...current, option.id])
                    } else {
                      setSelectedAnswer(current.filter(id => id !== option.id))
                    }
                  }}
                  disabled={showFeedback}
                />
                <Label htmlFor={`${id}-${option.id}`} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
                {showCorrect && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {showWrong && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Open Ended */}
      {type === 'open_ended' && (
        <Textarea
          value={openAnswer}
          onChange={(e) => setOpenAnswer(e.target.value)}
          placeholder="Escribe tu respuesta aquí..."
          disabled={showFeedback}
          className="min-h-[120px] mb-4"
        />
      )}

      {/* Feedback Panel */}
      {showFeedback && explanation && (
        <div className={cn(
          "mt-4 p-4 rounded-lg border-2",
          isCorrectAnswer() || type === 'open_ended'
            ? "bg-blue-50 border-blue-200"
            : "bg-amber-50 border-amber-200"
        )}>
          <div className="flex items-start gap-2 mb-2">
            {isCorrectAnswer() && type !== 'open_ended' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">
                {isCorrectAnswer() && type !== 'open_ended'
                  ? "¡Correcto!"
                  : type === 'open_ended'
                  ? "Explicación"
                  : "No del todo..."}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4">
        {!showFeedback ? (
          <Button
            onClick={handleCheck}
            disabled={!isAnswered}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            Verificar Respuesta
          </Button>
        ) : (
          <>
            <Button
              onClick={handleReset}
              variant="outline"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
            {onDiscuss && (
              <Button
                onClick={handleDiscuss}
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Profundizar en Chat
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
