"use client"

import { use } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowRight, Activity, Bot, Inbox } from "lucide-react"

export default function ProgramAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = use(params)
  const programId = decodeURIComponent(rawId)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            <Breadcrumbs />

            <PageHeader
              title="Analytics del Programa"
              description="Vista de salud del cohorte, alertas IA y bandeja de entregas para revisión."
              actions={
                <Button variant="outline" asChild>
                  <Link href={`/programas/${programId}`}>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Volver al programa
                  </Link>
                </Button>
              }
            />

            <Alert>
              <AlertTitle>Ruta /analytics lista</AlertTitle>
              <AlertDescription>
                Esta página es un placeholder inicial para evitar el 404. Aquí irán las secciones:
                métricas de salud, análisis IA opcional, y la bandeja de entregas por revisar.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Salud del Cohorte
                  </CardTitle>
                  <CardDescription>KPIs y gráficas nativas reemplazarán el antiguo tracking.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Próximamente: CohortProgressChart y StudentRiskList consumiendo /api/cohorts/:id/analytics.</p>
                  <p>Usa esta página para iterar la nueva vista, sin depender del ejercicio de tracking.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    Alertas IA
                  </CardTitle>
                  <CardDescription>Botón “Analizar Cohorte con IA”.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Reserva este espacio para los insights cualitativos generados bajo demanda.</p>
                  <p>La acción puede disparar un llamado al endpoint de analytics o a OpenAI.</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-muted-foreground" />
                  Bandeja de Entregas
                </CardTitle>
                <CardDescription>Submissions en estado submitted_for_review.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  Aquí irá la tabla <code>SubmissionQueue</code> apuntando a /analytics/submission/[progressId] para
                  revisión.
                </p>
                <p>Por ahora no hay datos conectados; agrega la integración cuando el endpoint esté listo.</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
