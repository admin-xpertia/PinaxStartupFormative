"use client"

import { useState } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, Download, BarChart3, FileText, CheckCircle2, TrendingUp } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Wizard de 3 pasos: Upload → Análisis → Resultados
interface AnalysisToolContent {
  titulo: string
  descripcion: string
  tipoAnalisis: "interview_synthesis" | "data_analysis" | "competitor_analysis"
  instrucciones: string[]
  outputFormat: "themes" | "matrix" | "metrics"
}

interface HerramientaAnalisisPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: AnalysisToolContent
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
}

export function HerramientaAnalisisPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  onSave,
  onComplete,
  onExit,
}: HerramientaAnalisisPlayerProps) {
  const [currentStep, setCurrentStep] = useState<"upload" | "analyzing" | "results">("upload")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [editedResults, setEditedResults] = useState<any>(null)

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      setUploadedFiles(Array.from(files))
    }
  }

  const handleAnalyze = async () => {
    setCurrentStep("analyzing")

    // Simular análisis (en producción llamaría a la API)
    setTimeout(() => {
      const mockResults = {
        themes: [
          { name: "Problema Principal", frequency: 8, quotes: ["Quote 1", "Quote 2"] },
          { name: "Solución Propuesta", frequency: 6, quotes: ["Quote 3"] },
          { name: "Willingness to Pay", frequency: 5, quotes: ["Quote 4", "Quote 5"] },
        ],
        matrix: [
          { problem: "Gestión de inventario", p1: true, p2: false, p3: true },
          { problem: "Costos operativos", p1: true, p2: true, p3: false },
        ],
      }
      setAnalysisResults(mockResults)
      setEditedResults(mockResults)
      setCurrentStep("results")
    }, 2000)
  }

  const handleExport = () => {
    // Exportar resultados editados
    const dataStr = JSON.stringify(editedResults, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "analysis-results.json"
    link.click()
  }

  const renderUploadStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paso 1: Cargar Datos para Análisis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Arrastra archivos aquí o haz click para seleccionar
            </p>
            <input
              type="file"
              multiple
              accept=".txt,.pdf,.doc,.docx"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Seleccionar Archivos
              </label>
            </Button>
          </div>

          {uploadedFiles.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Archivos Cargados ({uploadedFiles.length})</h4>
              <div className="space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={uploadedFiles.length === 0}
            className="w-full"
            size="lg"
          >
            <BarChart3 className="h-5 w-5 mr-2" />
            Analizar con IA
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderAnalyzingStep = () => (
    <Card>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <h3 className="text-xl font-semibold">Analizando tus datos...</h3>
          <p className="text-muted-foreground">
            Esto puede tomar hasta 30 segundos
          </p>
          <Progress value={66} className="w-64 mx-auto" />
        </div>
      </CardContent>
    </Card>
  )

  const renderResultsStep = () => (
    <div className="space-y-6">
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Análisis Completo</p>
              <p className="text-xs text-muted-foreground">
                Revisa, edita y valida los resultados antes de exportar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="themes">
        <TabsList>
          <TabsTrigger value="themes">Temas Identificados</TabsTrigger>
          <TabsTrigger value="matrix">Matriz de Problemas</TabsTrigger>
          <TabsTrigger value="quotes">Citas Destacadas</TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="space-y-4">
          {analysisResults?.themes.map((theme: any, idx: number) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{theme.name}</CardTitle>
                  <Badge>{theme.frequency} menciones</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Citas representativas:</h5>
                  {theme.quotes.map((quote: string, qIdx: number) => (
                    <p key={qIdx} className="text-sm text-muted-foreground italic border-l-2 pl-3">
                      "{quote}"
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="matrix">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Matriz de análisis cruzado (implementación pendiente)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Citas destacadas organizadas por tema (implementación pendiente)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button onClick={handleExport} variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Exportar Resultados
        </Button>
        <Button onClick={() => setCurrentStep("upload")} variant="outline">
          Nuevo Análisis
        </Button>
      </div>
    </div>
  )

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      exerciseDescription={content.descripcion}
      proofPointName={proofPointName}
      totalSteps={3}
      currentStep={currentStep === "upload" ? 1 : currentStep === "analyzing" ? 2 : 3}
      onSave={onSave}
      onComplete={currentStep === "results" ? onComplete : undefined}
      onExit={onExit}
      showAIAssistant={false}
    >
      {currentStep === "upload" && renderUploadStep()}
      {currentStep === "analyzing" && renderAnalyzingStep()}
      {currentStep === "results" && renderResultsStep()}
    </ExercisePlayer>
  )
}
