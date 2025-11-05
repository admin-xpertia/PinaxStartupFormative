"use client"

import useSWR from "swr"
import { StudentDetailView } from "@/components/fase4/student-detail-view"
import { fetcher } from "@/lib/fetcher"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { notFound } from "next/navigation"
import type { EstudianteDetallado } from "@/types/student"

export default function StudentDetailPage({
  params,
}: {
  params: { id: string; estudianteId: string }
}) {
  const { data: student, error, isLoading } = useSWR<EstudianteDetallado>(
    `/api/v1/cohortes/${params.id}/estudiantes/${params.estudianteId}`,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingState text="Cargando estudiante..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <ErrorState message={error.message || "Error al cargar el estudiante"} />
      </div>
    )
  }

  if (!student) {
    notFound()
  }

  return (
    <div className="h-screen">
      <StudentDetailView student={student} cohorteId={params.id} />
    </div>
  )
}
