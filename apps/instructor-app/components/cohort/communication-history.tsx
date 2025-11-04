"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Megaphone, Mail, Bell, ChevronDown, ChevronUp } from "lucide-react"
import { mockCommunications } from "@/lib/mock-cohort-data"
import type { Communication } from "@/types/communication"

interface CommunicationHistoryProps {
  cohorteId: string
}

export function CommunicationHistory({ cohorteId }: CommunicationHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getTypeIcon = (tipo: Communication["tipo"]) => {
    switch (tipo) {
      case "anuncio":
        return <Megaphone className="h-5 w-5 text-primary" />
      case "mensaje_individual":
        return <Mail className="h-5 w-5 text-blue-500" />
      case "recordatorio_automatico":
        return <Bell className="h-5 w-5 text-amber-500" />
    }
  }

  const getTypeLabel = (tipo: Communication["tipo"]) => {
    switch (tipo) {
      case "anuncio":
        return "Anuncio"
      case "mensaje_individual":
        return "Mensaje Individual"
      case "recordatorio_automatico":
        return "Recordatorio Automático"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Historial de Comunicaciones</h2>
          <p className="text-sm text-slate-500">Todos los mensajes enviados a esta cohorte</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Anuncio
        </Button>
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-4">
        {mockCommunications.map((comm) => (
          <div key={comm.id} className="border rounded-lg bg-card">
            {/* Header */}
            <div className="p-4 flex items-start gap-4">
              <div className="mt-1">{getTypeIcon(comm.tipo)}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{comm.asunto}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <span>{formatDate(comm.fecha_envio)}</span>
                      <span>•</span>
                      <span>Por {comm.remitente}</span>
                    </div>
                  </div>
                  <Badge variant="outline">{getTypeLabel(comm.tipo)}</Badge>
                </div>

                {/* Preview */}
                <p className="text-sm text-slate-600 line-clamp-2">{comm.contenido}</p>

                {/* Metrics */}
                <div className="flex items-center gap-6 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Destinatarios:</span>
                    <span className="font-medium">{comm.destinatarios}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Abierto por:</span>
                    <span className="font-medium">
                      {comm.abierto_por} ({Math.round((comm.abierto_por / comm.destinatarios) * 100)}
                      %)
                    </span>
                  </div>
                  {comm.respondido_por !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Respondido por:</span>
                      <span className="font-medium">{comm.respondido_por}</span>
                    </div>
                  )}
                </div>

                {/* Expand Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 gap-2"
                  onClick={() => setExpandedId(expandedId === comm.id ? null : comm.id)}
                >
                  {expandedId === comm.id ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Ver completo
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedId === comm.id && (
              <div className="border-t p-4 bg-slate-50">
                <div className="prose prose-sm max-w-none">
                  <p>{comm.contenido}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="secondary" size="sm">
                    Reenviar
                  </Button>
                  <Button variant="secondary" size="sm">
                    Duplicar
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
