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

export default function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const {
    data: program,
    error,
    isLoading,
    mutate,
  } = useSWR<Program>(id ? `/api/v1/programas/${id}` : null, fetcher)

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
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

      console.log("Sending PUT request to:", `/api/v1/programas/${id}`)
      console.log("Request body:", updatedProgram)

      const response = await fetch(`/api/v1/programas/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatedProgram),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response:", errorData)
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("Save successful:", result)

      // Revalidar datos
      await mutate()

      toast.success("Programa actualizado exitosamente")
      router.push(`/programas/${id}`)
    } catch (error) {
      console.error("Error saving program:", error)
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
