"use client"

import useSWR from "swr"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { fetcher } from "@/lib/fetcher"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { notFound } from "next/navigation"

export default function EditProgramPage({ params }: { params: { id: string } }) {
  const {
    data: program,
    error,
    isLoading,
    mutate,
  } = useSWR(params?.id ? `/api/v1/programas/${params.id}` : null, fetcher)

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            <LoadingState text="Cargando programa..." />
          </main>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            <ErrorState message={error.message || "Error al cargar el programa"} retry={() => mutate()} />
          </main>
        </div>
      </div>
    )
  }

  if (!program) {
    notFound()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            <Breadcrumbs />
            <PageHeader
              title={`Editar: ${program.nombre}`}
              description="Modifica la información y estructura del programa"
            />
            <div className="text-center py-12">
              <p className="text-muted-foreground">Próximamente: Editor completo del programa</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
