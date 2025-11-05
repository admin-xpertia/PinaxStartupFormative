"use client"

import { useEffect, useMemo } from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { FaseDocumentationEditor } from "@/components/fase2/fase-documentation-editor"
import type { FaseDocumentation } from "@/types/fase"
import { toast } from "@/hooks/use-toast"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData.message || "Error al cargar la documentación de la fase"
    throw new Error(message)
  }
  return response.json()
}

type FaseDocumentationResponse = (FaseDocumentation & { fase_nombre?: string | null }) | null

export default function FaseDocumentacionPage({
  params,
}: {
  params: { id: string; faseId: string }
}) {
  const router = useRouter()
  const documentacionEndpoint = useMemo(() => {
    if (!params?.faseId) {
      return null
    }
    return `/api/v1/programas/fases/${encodeURIComponent(params.faseId)}/documentacion`
  }, [params?.faseId])

  const {
    data: documentacion,
    error,
    isLoading,
    mutate,
  } = useSWR<FaseDocumentationResponse>(documentacionEndpoint, fetcher, {
    revalidateOnFocus: false,
  })

  useEffect(() => {
    if (error) {
      toast({
        title: "Error al cargar",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [error])

  const faseNombre = useMemo(() => {
    if (documentacion && documentacion.fase_nombre) {
      return documentacion.fase_nombre
    }
    return "Documentación de la fase"
  }, [documentacion])

  const handleSave = async (doc: FaseDocumentation) => {
    try {
      if (!documentacionEndpoint) {
        throw new Error("No se encontró el endpoint de documentación")
      }

      const response = await fetch(documentacionEndpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...doc, fase_id: params.faseId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.message || "No pudimos guardar la documentación"
        throw new Error(message)
      }

      const savedDoc: FaseDocumentationResponse = await response.json()
      mutate(savedDoc, false)

      toast({
        title: "Documentación guardada",
        description: "La documentación de la fase se guardó con éxito.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al guardar"
      toast({
        title: "Error al guardar",
        description: message,
        variant: "destructive",
      })
      throw error
    }
  }

  const handleClose = () => {
    router.back()
  }

  return (
    <FaseDocumentationEditor
      programaId={params.id}
      faseId={params.faseId}
      faseNombre={faseNombre}
      documentacionExistente={documentacion ?? null}
      onSave={handleSave}
      onClose={handleClose}
    />
  )
}
