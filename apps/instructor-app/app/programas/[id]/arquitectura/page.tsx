'use client';

import useSWR from "swr"
import { useParams } from "next/navigation"
import { VisualRoadmapBuilder } from "@/components/fase2/visual-roadmap-builder"
import { LoadingState } from "@/components/shared/loading-state"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.message || "Error al cargar la arquitectura del programa")
  }
  return response.json()
}

export default function ArquitecturaPage() {
  const params = useParams()
  const programaIdParam = params?.id
  const programaId = Array.isArray(programaIdParam) ? programaIdParam[0] : programaIdParam

  const {
    data: programa,
    error,
    isLoading,
    mutate,
  } = useSWR(programaId ? `/api/v1/programas/${programaId}/arquitectura` : null, fetcher, {
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
    <div className="h-screen">
      <VisualRoadmapBuilder programaId={programaId} programa={programa} onUpdate={handleUpdate} readonly={false} />
    </div>
  )
}
