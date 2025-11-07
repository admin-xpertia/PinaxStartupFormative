"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { notFound } from "next/navigation"
import type { Program } from "@/types/program"
import { ProgramEditor } from "@/components/fase2/ProgramEditor"
import { toast } from "sonner"
import { programsApi } from "@/services/api"

export default function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const {
    data: program,
    error,
    isLoading,
    mutate,
  } = useSWR<Program>(id ? `program-${id}` : null, () => id ? programsApi.getById(id) : null)

  if (isLoading) {
    return <LoadingState text="Cargando programa..." />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorState message={error.message || "Error al cargar el programa"} retry={() => mutate()} />
      </div>
    )
  }

  if (!program) {
    notFound()
  }

  const handleSave = async (updatedProgram: any) => {
    try {
      console.log("Updating program:", id)
      console.log("Request body:", updatedProgram)

      const result = await programsApi.update(id, updatedProgram)

      console.log("Save successful:", result)

      // Revalidar datos
      await mutate()

      toast.success("Programa actualizado exitosamente")
      router.push(`/programas/${id}`)
    } catch (error) {
      console.error("Error saving program:", error)
      toast.error(error instanceof Error ? error.message : "Error al guardar el programa")
      throw error
    }
  }

  const handleCancel = () => {
    router.push(`/programas/${id}`)
  }

  return (
    <ProgramEditor programaId={id} programaActual={program} onSave={handleSave} onCancel={handleCancel} />
  )
}
