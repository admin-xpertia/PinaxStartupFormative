"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardAnalyticsProps {
  label: string
  valor: string
  icono: React.ReactNode
  color: "emerald" | "blue" | "cyan" | "amber" | "rose"
  tendencia?: {
    valor: string
    direccion: "up" | "down"
    periodo: string
    positivo: boolean
  }
  alerta?: boolean
  link?: string
  tooltip?: string
}

export function StatsCardAnalytics({
  label,
  valor,
  icono,
  color,
  tendencia,
  alerta,
  link,
  tooltip,
}: StatsCardAnalyticsProps) {
  const colorClasses = {
    emerald: "text-emerald-600 bg-emerald-50",
    blue: "text-blue-600 bg-blue-50",
    cyan: "text-cyan-600 bg-cyan-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50",
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold mb-2">{valor}</p>
          {tendencia && (
            <div className="flex items-center gap-1 text-sm">
              {tendencia.direccion === "up" ? (
                <TrendingUp className={cn("h-4 w-4", tendencia.positivo ? "text-emerald-600" : "text-rose-600")} />
              ) : (
                <TrendingDown className={cn("h-4 w-4", tendencia.positivo ? "text-emerald-600" : "text-rose-600")} />
              )}
              <span className={cn("font-medium", tendencia.positivo ? "text-emerald-600" : "text-rose-600")}>
                {tendencia.valor}
              </span>
              <span className="text-muted-foreground">{tendencia.periodo}</span>
            </div>
          )}
          {link && (
            <button
              className="text-sm text-primary hover:underline mt-2"
              onClick={() => console.log("Navigate to:", link)}
            >
              {link}
            </button>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", colorClasses[color])}>{icono}</div>
      </div>
    </Card>
  )
}
