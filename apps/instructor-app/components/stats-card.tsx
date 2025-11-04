import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, Calendar, TrendingUp, ArrowUp } from "lucide-react"
import type { QuickStat } from "@/types/program"

const iconMap = {
  BookOpen,
  Users,
  Calendar,
  TrendingUp,
}

interface StatsCardProps {
  stat: QuickStat
}

export function StatsCard({ stat }: StatsCardProps) {
  const Icon = iconMap[stat.icono as keyof typeof iconMap]

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.metrica}</p>
            {stat.tendencia && (
              <div className="flex items-center gap-1 text-xs">
                {stat.tendencia_positiva && <ArrowUp className="h-3 w-3 text-success" />}
                <span className={stat.tendencia_positiva ? "text-success" : "text-muted-foreground"}>
                  {stat.tendencia}
                </span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
