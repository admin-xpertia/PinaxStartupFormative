"use client"

import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Mail, Book, Video } from "lucide-react"

export default function SoportePage() {
  const { sidebarCollapsed } = useUIStore()

  const supportOptions = [
    {
      icon: MessageSquare,
      title: "Chat en Vivo",
      description: "Habla con nuestro equipo de soporte en tiempo real",
      action: "Iniciar Chat",
      available: false,
    },
    {
      icon: Mail,
      title: "Email",
      description: "Envíanos un correo y te responderemos en 24 horas",
      action: "Enviar Email",
      available: true,
    },
    {
      icon: Book,
      title: "Base de Conocimiento",
      description: "Encuentra respuestas en nuestra documentación",
      action: "Ver Artículos",
      available: false,
    },
    {
      icon: Video,
      title: "Video Tutoriales",
      description: "Aprende con nuestros tutoriales en video",
      action: "Ver Videos",
      available: false,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Sidebar />

      <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
        <div className="p-6 space-y-6">
          <Breadcrumbs />

          <PageHeader title="Centro de Soporte" subtitle="Estamos aquí para ayudarte" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {supportOptions.map((option) => {
              const Icon = option.icon
              return (
                <Card key={option.title}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{option.title}</CardTitle>
                        <CardDescription>{option.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button disabled={!option.available} className="w-full">
                      {option.action}
                    </Button>
                    {!option.available && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">Próximamente disponible</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
