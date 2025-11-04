import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockPrograms } from "@/lib/mock-data"
import { Edit, Eye, Users, BarChart3, Layers, Target, Clock, BookOpen, FileText, Workflow } from "lucide-react"
import Link from "next/link"

export default function ProgramDetailPage({ params }: { params: { id: string } }) {
  // Find the program by ID
  const program = mockPrograms.find((p) => p.id === params.id) || mockPrograms[0]
  const isPublished = program.estado === "publicado"

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            <Breadcrumbs />

            <PageHeader
              title={program.nombre}
              description={program.descripcion}
              actions={
                <div className="flex items-center gap-2">
                  <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "Publicado" : "Borrador"}
                  </Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/programas/${program.id}/preview`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Vista Previa
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/programas/${program.id}/editar`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </Button>
                </div>
              }
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    Fases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{program.estadisticas.fases}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Proof Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{program.estadisticas.proof_points}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Duración
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{program.estadisticas.duracion}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Estudiantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{program.estadisticas.estudiantes}</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="architecture">Arquitectura</TabsTrigger>
                <TabsTrigger value="content">Contenido</TabsTrigger>
                <TabsTrigger value="cohortes">Cohortes</TabsTrigger>
                <TabsTrigger value="settings">Configuración</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Workflow className="h-5 w-5" />
                        Arquitectura del Programa
                      </CardTitle>
                      <CardDescription>Visualiza y edita la estructura de fases y proof points</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <Link href={`/programas/${program.id}/arquitectura`}>Ver Arquitectura Visual</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Documentación de Fases
                      </CardTitle>
                      <CardDescription>Completa la documentación para generar contenido con IA</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full bg-transparent" variant="outline">
                        <Link href={`/programas/${program.id}/fases/fase-1/documentacion`}>Editar Documentación</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Generación de Contenido
                      </CardTitle>
                      <CardDescription>Genera lecciones, cuadernos y simulaciones con IA</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full bg-transparent" variant="outline">
                        <Link href="/generation/demo">Generar Contenido</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Analytics y Progreso
                      </CardTitle>
                      <CardDescription>Monitorea el desempeño de tus cohortes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full bg-transparent" variant="outline">
                        <Link href="/cohortes">Ver Cohortes</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="architecture">
                <Card>
                  <CardHeader>
                    <CardTitle>Arquitectura del Programa</CardTitle>
                    <CardDescription>Visualiza la estructura completa de tu programa</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        Visualiza y edita la arquitectura completa del programa
                      </p>
                      <Button asChild>
                        <Link href={`/programas/${program.id}/arquitectura`}>Abrir Vista de Arquitectura</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestión de Contenido</CardTitle>
                    <CardDescription>Administra todo el contenido del programa</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">Próximamente: Vista de gestión de contenido</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cohortes">
                <Card>
                  <CardHeader>
                    <CardTitle>Cohortes Activas</CardTitle>
                    <CardDescription>Gestiona las cohortes de este programa</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No hay cohortes activas para este programa</p>
                      <Button asChild>
                        <Link href="/cohortes">Crear Nueva Cohorte</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración del Programa</CardTitle>
                    <CardDescription>Ajusta la configuración general del programa</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">Próximamente: Configuración del programa</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
