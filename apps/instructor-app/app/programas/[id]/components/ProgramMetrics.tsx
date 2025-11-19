"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface ProgramMetric {
  label: string
  value: string
  helper: string
  variant?: "warning"
}

export function ProgramMetrics({ metrics }: { metrics: ProgramMetric[] }) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {metrics.map((item) => (
        <Card
          key={item.label}
          className={cn(
            "border bg-card shadow-sm",
            item.variant === "warning" && "border-amber-200 bg-amber-50/60 text-amber-900",
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
            <CardDescription>{item.helper}</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-3xl font-semibold tracking-tight",
                item.variant === "warning" && "text-amber-600",
              )}
            >
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
