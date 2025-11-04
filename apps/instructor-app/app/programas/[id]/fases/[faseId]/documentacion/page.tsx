"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FaseDocumentationEditor } from "@/components/fase2/fase-documentation-editor"
import type { FaseDocumentation } from "@/types/fase"

export default function FaseDocumentacionPage({
  params,
}: {
  params: { id: string; faseId: string }
}) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  // Mock data - replace with actual data fetching
  const faseNombre = "Fase 1: Descubrimiento y Validación"

  const handleSave = async (doc: FaseDocumentation) => {
    setIsSaving(true)
    try {
      // TODO: Save to backend
      console.log("Saving documentation:", doc)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setIsSaving(false)
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
      documentacionExistente={null}
      onSave={handleSave}
      onClose={handleClose}
    />
  )
}
