'use client';

import useSWR from "swr"
import { useParams, useRouter } from "next/navigation"
import { VisualRoadmapBuilder } from "@/components/fase2/visual-roadmap-builder"
import { LoadingState } from "@/components/shared/loading-state"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

const fetcher = async (url: string) => {
  const response = await apiClient.get(url)
  return response.data
}

export default function ArquitecturaPage() {
  const params = useParams()
  const router = useRouter()
  const programaIdParam = params?.id
  const programaId = Array.isArray(programaIdParam) ? programaIdParam[0] : programaIdParam

  const {
    data: programa,
    error,
    isLoading,
    mutate,
  } = useSWR(programaId ? `/programas/${programaId}/arquitectura` : null, fetcher, {
    revalidateOnFocus: false,
  })

  if (!programaId) {
    return <div>Programa no encontrado.</div>
  }

  if (isLoading) {
    return <LoadingState text="Cargando arquitectura del programa..." className="h-screen" />
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  if (!programa) {
    return <div>Programa no encontrado.</div>
  }

  const handleUpdate = async () => {
    await mutate()
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-background px-6 py-3 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{programa.nombre}</h1>
          <p className="text-sm text-muted-foreground">Arquitectura del programa</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <VisualRoadmapBuilder programaId={programaId} programa={programa} onUpdate={handleUpdate} readonly={false} />
      </div>
    </div>
  )
}
