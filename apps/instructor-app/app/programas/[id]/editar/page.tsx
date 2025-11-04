import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { mockPrograms } from "@/lib/mock-data"

export default function EditProgramPage({ params }: { params: { id: string } }) {
  const program = mockPrograms.find((p) => p.id === params.id) || mockPrograms[0]

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
